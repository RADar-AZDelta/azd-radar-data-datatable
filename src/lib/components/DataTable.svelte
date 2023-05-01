<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import {
    type ITableOptions,
    type ColumnSortChangedEventDetail,
    type ColumnFilterChangedEventDetail,
    type SortDirection,
    type TFilter,
    type IColumnMetaData,
    type PaginationChangedEventDetail,
    type FetchDataFunc,
    DataType,
    type SettingsVisibilityChangedEventDetail,
    type ColumnPositionChangedEventDetail,
    type ColumnWidthChangedEventDetail,
  } from './DataTable.d'
  import ColumnSort from './ColumnSort.svelte'
  import ColumnResize from './ColumnResize.svelte'
  import ColumnFilter from './ColumnFilter.svelte'
  import Pagination from './Pagination.svelte'
  import Spinner from './Spinner.svelte'
  import { dev } from '$app/environment'
  import { onDestroy } from 'svelte'
  import { DataTableWorker } from './DataTableWorker'
  import type Query from 'arquero/dist/types/query/query'
  import Options from './Options.svelte'
  import Modal from './Modal.svelte'
  import { flip } from 'svelte/animate'

  export let data: any[][] | any[] | FetchDataFunc | File | undefined,
    columns: IColumnMetaData[] | undefined = undefined,
    options: ITableOptions | undefined = undefined

  let renderedData: any[][] | any[] | undefined,
    filteredAndSortedData: any[][] | any[] | undefined,
    internalOptions: ITableOptions = {
      currentPage: 1,
      rowsPerPage: 20,
      rowsPerPageOptions: [5, 10, 20, 50, 100],
      actionColumn: false,
    },
    internalColumns: IColumnMetaData[] | undefined

  let renderStatus: string
  let columnResizing: boolean
  let dataType: DataType

  let worker: DataTableWorker
  let originalIndices: Uint32Array //the index of the sorted, filtered and paginated record in the original data

  let settingsVisibility: boolean = false

  $: {
    options, columns, data
    init()
  }
  $: visibleOrderedColumns = internalColumns
    ?.filter(col => col.visible !== false)
    .sort((a, b) => a.position! - b.position!)
  $: visibleOrderedColumnsOriginalColumnPosition = visibleOrderedColumns?.map(col =>
    dataType === DataType.Matrix || dataType === DataType.File
      ? internalColumns?.findIndex(c => c.id === col.id)!
      : col.id
  )

  async function init() {
    renderStatus = 'rendering'
    if (dev) console.log('DataTable: init')

    //OPTIONS
    if (options) Object.assign(internalOptions, options)
    internalOptions = internalOptions

    //DATA
    if (data && Array.isArray(data) && data.length > 0 && typeof data === 'object') {
      if (Array.isArray(data[0])) dataType = DataType.Matrix
      else if (typeof data[0] === 'object') dataType = DataType.ArrayOfObjects
    } else if (typeof data === 'function') dataType = DataType.Function
    else if (data instanceof File) {
      dataType = DataType.File
      const url = URL.createObjectURL(data as File)
      if (!worker) {
        worker = new DataTableWorker()
        await worker.init()
      }
      const extension = (data as File).name.split('.').pop()
      await worker.loadFile(url, extension!)
      URL.revokeObjectURL(url)
    } else return

    //COLUMNS
    if (!columns) {
      if (dataType === DataType.ArrayOfObjects) {
        //columns is not defined, and data is an array of objects => extract the columns from the first object
        internalColumns = Object.keys((data as any[])[0]).map((key, index) => ({
          id: key,
          position: index + 1,
        }))
      } else if (dataType === DataType.File) {
        //get columns from worker
        internalColumns = (await worker!.getColumnNames()).map((key, index) => ({
          id: key,
          position: index + 1,
        }))
      } else throw new Error('Columns property is not provided')
    } else {
      if (dataType === DataType.File) {
        if (columns.length != internalColumns?.length) {
          await worker?.insertColumns(columns)
        }
      }
      internalColumns = columns
    }

    await render()
    renderStatus = 'completed'
  }

  async function render(onlyPaginationChanged = false) {
    if (dev) console.log('DataTable: render')
    renderedData = undefined
    if (dataType === DataType.Function) {
      let start: number
      const filteredColumns = internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.filter)
        return acc
      }, new Map<string, TFilter>())
      const sortedColumns = internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.sortDirection)
        return acc
      }, new Map<string, SortDirection>())
      if (dev) start = performance.now()
      const results = await (data as FetchDataFunc)(filteredColumns, sortedColumns, internalOptions)
      if (dev) {
        const end = performance.now()
        console.log(`DataTable: fetchData function took: ${Math.round(end - start!)} ms`)
      }
      internalOptions.totalRows = results.totalRows
      renderedData = results.data
    } else if (dataType === DataType.Matrix || dataType === DataType.ArrayOfObjects) {
      if (!onlyPaginationChanged || !filteredAndSortedData) {
        filteredAndSortedData = applySort(applyFilter(data as any[][] | any[]))
        internalOptions.totalRows = filteredAndSortedData.length
      }
      renderedData = applyPagination(filteredAndSortedData)
      originalIndices = (renderedData as any[]).reduce((acc, cur) => {
        acc.push((data as any[]).indexOf(cur))
        return acc
      }, [])
    } else if (dataType === DataType.File) {
      const filteredColumns = internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.filter)
        return acc
      }, new Map<string, TFilter>())
      const sortedColumns = internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.sortDirection)
        return acc
      }, new Map<string, SortDirection>())
      const results = await worker?.fetchData(filteredColumns, sortedColumns, internalOptions, onlyPaginationChanged)
      internalOptions.totalRows = results!.totalRows
      renderedData = results!.data
      originalIndices = results!.indices
    }
  }

  function applyFilter(data: any[][] | any[]): any[][] | any[] {
    internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (dev) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        if (dataType === DataType.Matrix) {
          const index = internalColumns?.findIndex(c => c.id === col.id)
          data = data.filter(row => row[index!]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
        } else if (dataType === DataType.ArrayOfObjects) {
          data = data.filter(obj => obj[col.id]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
        }
      })
    return data
  }

  function applySort(data: any[][] | any[]): any[][] | any[] {
    //TODO: ignore case, use localCompare for strings, convert Dates to milliseconds using .getTime()
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    internalColumns
      ?.filter(col => col.sortDirection)
      .slice()
      .reverse() //Sort is applied in reverse order !!!
      .forEach((col, index) => {
        if (dev) console.log(`DataTable: applying sort order '${col.sortDirection}' on column '${col.id}'`)
        if (dataType === DataType.Matrix) {
          switch (col.sortDirection) {
            case 'asc':
              compareFn = (a, b) => (a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : 0)
              break
            case 'desc':
              compareFn = (a, b) => (b[index] < a[index] ? -1 : b[index] > a[index] ? 1 : 0)
              break
          }
        } else if (dataType === DataType.ArrayOfObjects) {
          switch (col.sortDirection) {
            case 'asc':
              compareFn = (a, b) => (a[col.id] < b[col.id] ? -1 : a[col.id] > b[col.id] ? 1 : 0)
              break
            case 'desc':
              compareFn = (a, b) => (b[col.id] < a[col.id] ? -1 : b[col.id] > a[col.id] ? 1 : 0)
              break
          }
        }
        data = data.sort(compareFn)
      })
    return data
  }

  function applyPagination(data: any[][] | any[]): any[][] | any[] {
    const start = (internalOptions.currentPage! - 1) * internalOptions.rowsPerPage!
    const end = internalOptions.currentPage! * internalOptions.rowsPerPage!
    if (dev) console.log(`DataTable: applying pagination row ${start} - ${end}`)
    data = data.slice(start, end)
    return data
  }

  async function onColumnFilterChanged(event: CustomEvent<ColumnFilterChangedEventDetail>) {
    const column = internalColumns?.find(col => col.id === event.detail.column)
    column!.filter = event.detail.filter
    internalColumns = internalColumns
    filteredAndSortedData = undefined

    if (dev) console.log(`DataTable: column '${event.detail.column}' filter changed to '${event.detail.filter}'`)

    internalOptions.currentPage = 1
    await render()
  }

  async function onColumnWidthChanged(event: CustomEvent<ColumnWidthChangedEventDetail>) {
    columnResizing = event.detail.done !== true
    const column = internalColumns?.find(column => column.id === event.detail.column)
    column!.width = event.detail.width
    internalColumns = internalColumns
    if (dev) console.log(`DataTable: column '${column!.id}' width changed to '${event.detail.width}'`)
  }

  async function onColumnPositionChanged(event: CustomEvent<ColumnPositionChangedEventDetail>) {
    const sourceColumn = internalColumns?.find(column => column.id === event.detail.column)
    const sourcePosition = sourceColumn?.position
    const destinationPosition = event.detail.position
    internalColumns?.forEach(column => {
      if (column.id == event.detail.column) column.position = event.detail.position
      else if (sourcePosition! < column.position! && column.position! <= destinationPosition) column.position! -= 1
      else if (destinationPosition <= column.position! && column.position! < sourcePosition!) column.position! += 1
    })
    internalColumns = internalColumns
    if (dev)
      console.log(
        `DataTable: column '${sourceColumn!.id}' position changed from '${sourcePosition}' to '${destinationPosition}'`
      )
  }

  async function onColumnSortChanged(event: CustomEvent<ColumnSortChangedEventDetail>) {
    const column = internalColumns?.find(col => col.id === event.detail.column)
    column!.sortDirection = event.detail.sortDirection
    internalColumns = internalColumns
    filteredAndSortedData = undefined

    if (dev) console.log(`DataTable: column '${event.detail.column}' sort changed to '${event.detail.sortDirection}'`)

    internalOptions.currentPage = 1
    await render()
  }

  async function onPaginationChanged(event: CustomEvent<PaginationChangedEventDetail>) {
    internalOptions.rowsPerPage = event.detail.rowsPerPage
    internalOptions.currentPage = event.detail.currentPage
    internalOptions = internalOptions

    if (dev) console.log(`DataTable: pagination changed to ${JSON.stringify(event.detail)}`)

    await render(true)
  }

  async function onSettingsVisibilityChanged(event: CustomEvent<SettingsVisibilityChangedEventDetail>) {
    settingsVisibility = event.detail.visibility
  }

  async function onColumnVisibilityChanged(e: Event) {
    const inputEl = e.target as HTMLInputElement
    internalColumns!.find(col => col.id == inputEl.id)!.visible = inputEl.checked
    internalColumns = internalColumns
  }

  export async function saveToFile() {
    const opts = {
      types: [
        {
          description: 'CSV file',
          accept: { 'text/csv': ['.csv'] },
        },
      ],
    }
    const fileHandle = await (<any>window).showSaveFilePicker(opts)
    switch (dataType) {
      case DataType.File:
        await worker!.saveToFile(fileHandle)
        break
      default:
        throw new Error('Not yet supported')
    }
  }

  export async function updateRows(rowsToUpdateByIndex: Map<number, Record<string, any>>) {
    switch (dataType) {
      case DataType.File:
        const rowsToUpdateByWorkerIndex = [...rowsToUpdateByIndex].reduce<Map<number, Record<string, any>>>(
          (acc, [index, row]) => {
            acc.set(originalIndices[index], row) //swap the local index with the worker index
            return acc
          },
          new Map<number, Record<string, any>>()
        )
        await worker!.updateRows(rowsToUpdateByWorkerIndex)
        break
      case DataType.Matrix:
        for (const [index, row] of rowsToUpdateByIndex) {
          const originalRow = (data as any[][])[originalIndices[index]]
          for (const [column, value] of Object.entries(row)) {
            const index = internalColumns?.findIndex(c => c.id === column)
            originalRow[index!] = value
          }
        }
        break
      case DataType.ArrayOfObjects:
        for (const [index, row] of rowsToUpdateByIndex) {
          Object.assign((data as any[])[originalIndices[index]], row)
        }
        break
      default:
        throw new Error('Not yet supported')
    }

    for (const [index, row] of rowsToUpdateByIndex) {
      const renderedRow = (renderedData as any[])[index]
      for (const [column, value] of Object.entries(row)) {
        const index = internalColumns?.findIndex(c => c.id === column)
        renderedRow[index!] = value
      }
    }
    renderedData = renderedData
  }

  export async function insertRows(rows: Record<string, any>[]) {
    switch (dataType) {
      case DataType.File:
        await worker!.insertRows(rows)
        break
      case DataType.Matrix:
        for (const row of rows) {
          ;(data as any[][]).push(
            columns!.reduce((acc, column) => {
              acc.push(row[column.position!])
              return acc
            }, [] as any[])
          )
        }
        break
      case DataType.ArrayOfObjects:
        ;(data as any[]).push(...rows)
        break
      default:
        throw new Error('Not yet supported')
    }
    await render(false)
  }

  export async function deleteRows(indices: number[]) {
    switch (dataType) {
      case DataType.File:
        const workerIndices = indices.map(index => indices[index]) //translate local index (on GUI) to worker row index
        await worker!.deleteRows(workerIndices.length == 1 && workerIndices[0] == undefined ? indices : workerIndices)
        break
      case DataType.Matrix:
      case DataType.ArrayOfObjects:
        for (const index of indices.sort((a, b) => b - a)) {
          ;(data as any[]).splice(originalIndices[index], 1)
        }
        break
      default:
        throw new Error('Not yet supported')
    }
    await render(false)
  }

  export function getColumns() {
    return internalColumns
  }

  export async function getFullRow(index: number): Promise<Record<string, any>> {
    switch (dataType) {
      case DataType.File:
        return await worker!.getRow(index)
      case DataType.Matrix:
        return columns!.reduce((acc, column, idx) => {
          acc[column.id] = (data as any[][])[index][idx]
          return acc
        }, {} as Record<string, any>)
      case DataType.ArrayOfObjects:
        return (data as any[])[index]
      default:
        throw new Error('Not yet supported')
    }
  }

  export async function insertColumns(cols: IColumnMetaData[]) {
    let uniqueColumns: IColumnMetaData[] = []
    for (let col of cols) {
      switch (dataType) {
        case DataType.File:
        case DataType.Matrix:
        case DataType.ArrayOfObjects:
          if (internalColumns!.find(c => c.id === col.id)) console.error(`Column with id ${col.id} already exists`)
          else {
            if (!col.position)
              col.position =
                internalColumns!.reduce<number>((acc, cur) => {
                  if (cur.position! > acc) return cur.position!
                  else return acc
                }, 0) + 1 //add new column at end (with last position)
            uniqueColumns.push(col)
          }
          break
        default:
          throw new Error('Not yet supported')
      }
    }
    switch (dataType) {
      case DataType.File:
        await worker!.insertColumns(uniqueColumns)
        break
    }
    internalColumns = internalColumns!.concat(uniqueColumns)
    await render(false)
  }

  export async function updateColumns(cols: IColumnMetaData[]) {
    for (let col of cols) {
      if (internalColumns!.find(column => column.id == col.id) == undefined)
        throw new Error(`Column with id ${col.id} doesn't exist`)
      else {
        const index = internalColumns!.findIndex(column => column.id == col.id)
        Object.assign(internalColumns![index], col)
      }
    }
    internalColumns = internalColumns
  }

  export async function executeQueryAndReturnResults(query: Query | object): Promise<any> {
    switch (dataType) {
      case DataType.File:
        return await worker!.executeQueryAndReturnResults(query)!
      default:
        throw new Error('Not yet supported')
    }
  }

  export function getTablePagination() {
    return {
      currentPage: internalOptions.currentPage,
      rowsPerPage: internalOptions.rowsPerPage,
      totalRows: internalOptions.totalRows,
    }
  }

  export function changePagination(pag: { currentPage?: number; rowsPerPage?: number }) {
    if (pag.currentPage) internalOptions.currentPage = pag.currentPage
    if (pag.rowsPerPage) internalOptions.rowsPerPage = pag.rowsPerPage
    internalOptions = internalOptions
    render(true)
  }

  onDestroy(() => {
    worker?.destroy()
  })
</script>

<Modal on:settingsVisibilityChanged={onSettingsVisibilityChanged} show={settingsVisibility}>
  <h1>Change column visability:</h1>
  {#if internalColumns}
    {#each internalColumns.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as column}
      <div>
        <input
          type="checkbox"
          id={column.id}
          checked={column.visible == undefined ? true : column.visible}
          on:change={onColumnVisibilityChanged}
        />
        <label for={column.id}>{column.label ?? column.id}</label><br />
      </div>
    {/each}
  {/if}
</Modal>

<div data-component="RADar-DataTable" data-status={renderStatus ?? ''}>
  <div data-name="table-container">
    <table>
      <thead>
        {#if visibleOrderedColumns}
          <tr data-name="titles">
            {#if internalOptions.actionColumn}
              <th />
            {/if}
            {#each visibleOrderedColumns as column, i (column.id)}
              <th
                data-direction={column?.sortDirection}
                data-resizable={column?.resizable}
                data-key={column?.id}
                data-sortable={column?.sortable}
                animate:flip={{ duration: 500 }}
                style="{column.width ? `width: ${column.width}px` : ''};"
              >
                <ColumnResize
                  {column}
                  {columnResizing}
                  on:columnPositionChanged={onColumnPositionChanged}
                  on:columnWidthChanged={onColumnWidthChanged}
                >
                  <p>{column.label || column.id}</p>
                  {#if column.sortable !== false}
                    <ColumnSort
                      column={column.id}
                      sortDirection={column.sortDirection}
                      on:columnSortChanged={onColumnSortChanged}
                    />
                  {/if}
                </ColumnResize>
              </th>
            {/each}
          </tr>
          <tr data-name="filters">
            {#if internalOptions.actionColumn}
              {#if $$slots.actionHeader}
                <slot name="actionHeader" columns={visibleOrderedColumns} options={internalOptions} />
              {:else}
                <th />
              {/if}
            {/if}
            {#each visibleOrderedColumns as column, i (column.id)}
              <th
                data-direction={column?.sortDirection}
                data-resizable={column?.resizable}
                data-key={column?.id}
                data-filterable={column?.filterable}
                animate:flip={{ duration: 500 }}
                style="{column.width ? `width: ${column.width}px` : ''};"
              >
                <ColumnResize
                  {column}
                  {columnResizing}
                  on:columnPositionChanged={onColumnPositionChanged}
                  on:columnWidthChanged={onColumnWidthChanged}
                >
                  {#if column.filterable !== false}
                    <ColumnFilter
                      column={column.id}
                      inputType="text"
                      filter={column.filter}
                      on:columnFilterChanged={onColumnFilterChanged}
                    />
                  {/if}
                </ColumnResize>
              </th>
            {/each}
          </tr>
        {/if}
      </thead>
      <tfoot>
        {#if visibleOrderedColumns}
          <tr data-name="pagination">
            <th colspan={visibleOrderedColumns.length + (internalOptions.actionColumn ? 1 : 0)}>
              <div>
                <Options on:settingsVisibilityChanged={onSettingsVisibilityChanged} />
                <Pagination
                  rowsPerPage={internalOptions.rowsPerPage}
                  currentPage={internalOptions.currentPage}
                  rowsPerPageOptions={internalOptions.rowsPerPageOptions}
                  totalRows={internalOptions.totalRows ?? 0}
                  on:paginationChanged={onPaginationChanged}
                />
              </div>
            </th>
          </tr>
        {/if}
      </tfoot>
      <tbody>
        {#if renderedData && visibleOrderedColumnsOriginalColumnPosition}
          {#each renderedData as row, i (i)}
            <tr data-index={i}>
              {#if $$slots.default}
                <slot
                  renderedRow={visibleOrderedColumnsOriginalColumnPosition.map(index => row[index])}
                  index={i}
                  columns={visibleOrderedColumns}
                  options={internalOptions}
                />
              {:else}
                {#if internalOptions.actionColumn}
                  {#if $$slots.actionCell}
                    <slot
                      name="actionCell"
                      renderedRow={visibleOrderedColumnsOriginalColumnPosition.map(index => row[index])}
                      index={i}
                      columns={visibleOrderedColumns}
                      options={internalOptions}
                    />
                  {:else}
                    <td />
                  {/if}
                {/if}
                {#each visibleOrderedColumnsOriginalColumnPosition as index, j (index)}
                  <td animate:flip={{ duration: 500 }}>{row[index]}</td>
                {/each}
              {/if}
            </tr>
          {/each}
        {:else if data}
          {#if $$slots.loading}
            <slot name="loading" />
          {:else}
            <Spinner />
            <div>Loading...</div>
          {/if}
        {:else if $$slots.nodata}
          <slot name="nodata" />
        {:else}
          <div>No data...</div>
        {/if}
      </tbody>
    </table>
  </div>
</div>
