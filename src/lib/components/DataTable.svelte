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
    type ColumnPositionChangedEventDetail,
    type ColumnWidthChangedEventDetail,
    type ModifyColumnMetadataFunc,
  } from './DataTable.d'
  import ColumnSort from './ColumnSort.svelte'
  import ColumnResize from './ColumnResize.svelte'
  import ColumnFilter from './ColumnFilter.svelte'
  import Pagination from './Pagination.svelte'
  import Spinner from './Spinner.svelte'
  import { dev } from '$app/environment'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { DataTableWorker } from './DataTableWorker'
  import type Query from 'arquero/dist/types/query/query'
  import Options from './Options.svelte'
  import { flip } from 'svelte/animate'
  import { storeOptions } from '$lib/actions/storeOptions'
  import { browser } from '$app/environment'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'
  import SvgIcon from './SvgIcon.svelte'

  export let data: any[][] | any[] | FetchDataFunc | File | undefined,
    columns: IColumnMetaData[] | undefined = undefined,
    options: ITableOptions | undefined = undefined,
    disabled: boolean = false,
    modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined

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
  let dataType: DataType

  let worker: DataTableWorker
  let originalIndices: number[] //the index of the sorted, filtered and paginated record in the original data

  let settingsDialog: HTMLDialogElement

  const dispatch = createEventDispatcher()

  $: {
    options, columns, data
    init()
  }
  $: visibleOrderedColumns = internalColumns
    ?.filter(col => col.visible !== false)
    .sort((a, b) => a.position! - b.position!)

  async function init() {
    renderStatus = 'initializing'
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
    } else {
      renderStatus = ''
      renderedData = undefined
      return
    }
    //COLUMNS:
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

      if (modifyColumnMetadata) {
        const internalColumnsCopy = internalColumns.map(col => col.id)
        internalColumns = modifyColumnMetadata(internalColumns)
        const addedColumns = internalColumns.map(col => col.id).filter(x => !internalColumnsCopy.includes(x))
        if (addedColumns.length > 0)
          await worker?.insertColumns(
            internalColumns.reduce<IColumnMetaData[]>((acc, cur) => {
              if (addedColumns.includes(cur.id)) acc.push(cur)
              return acc
            }, [])
          )
      }
    } else internalColumns = columns

    await loadStoredOptions()
    await render()
    dispatch('initialized')
  }

  async function render(onlyPaginationChanged = false) {
    renderStatus = 'rendering'
    dispatch('rendering')
    if (dev) console.log('DataTable: render')
    renderedData = undefined
    if (dataType === DataType.Function) {
      let start: number
      const filteredColumns = internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.filter)
        return acc
      }, new Map<string, TFilter>())
      const sortedColumns = internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
        if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
        return acc
      }, new Map<string, SortDirection>())
      if (dev) start = performance.now()
      const results = await (data as FetchDataFunc)(filteredColumns, sortedColumns, internalOptions)
      if (dev) {
        const end = performance.now()
        console.log(`DataTable: fetchData function took: ${Math.round(end - start!)} ms`)
      }
      originalIndices = Array.from({ length: results.data.length }, (_, i) => i)
      internalOptions.totalRows = results.totalRows
      renderedData = results.data
    } else if (dataType === DataType.ArrayOfObjects) {
      if (!onlyPaginationChanged || !filteredAndSortedData) {
        filteredAndSortedData = applySort(applyFilter(data as any[]))
        internalOptions.totalRows = filteredAndSortedData.length
      }
      renderedData = applyPagination(filteredAndSortedData)
      originalIndices = (renderedData as Record<string, any>[]).reduce<number[]>((acc, cur) => {
        acc.push((data as Record<string, any>[]).indexOf(cur))
        return acc
      }, [])
    } else if (dataType === DataType.Matrix) {
      if (!onlyPaginationChanged || !filteredAndSortedData) {
        filteredAndSortedData = applySort(applyFilter(data as any[][]))
        internalOptions.totalRows = filteredAndSortedData.length
      }
      const paginatedData = applyPagination(filteredAndSortedData)
      renderedData = paginatedData.map(row =>
        internalColumns?.reduce((acc, cur, index) => {
          acc[cur.id!] = row[index]
          return acc
        }, {} as Record<string, any>)
      )
      originalIndices = (paginatedData as any[]).reduce((acc, cur) => {
        acc.push((data as any[]).indexOf(cur))
        return acc
      }, [])
    } else if (dataType === DataType.File) {
      const filteredColumns = internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
        if (cur && cur.filter) acc.set(cur.id, cur.filter)
        return acc
      }, new Map<string, TFilter>())
      const sortedColumns = internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
        if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
        return acc
      }, new Map<string, SortDirection>())
      const results = await worker?.fetchData(filteredColumns, sortedColumns, internalOptions, onlyPaginationChanged)
      internalOptions.totalRows = results!.totalRows
      renderedData = results!.data.map(row =>
        internalColumns?.reduce((acc, cur, index) => {
          acc[cur.id!] = row[index]
          return acc
        }, {} as Record<string, any>)
      )
      originalIndices = results!.indices.reduce<number[]>((acc, cur) => {
        acc.push(cur)
        return acc
      }, [])
    }
    renderStatus = 'completed'
    dispatch('renderingComplete')
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
    column!.filter = event.detail.filter?.toString().toLowerCase()
    internalColumns = internalColumns
    filteredAndSortedData = undefined

    if (dev) console.log(`DataTable: column '${event.detail.column}' filter changed to '${event.detail.filter}'`)

    internalOptions.currentPage = 1
    await render()
  }

  async function onColumnWidthChanged(event: CustomEvent<ColumnWidthChangedEventDetail>) {
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
    event.detail.rowsPerPage != internalOptions.rowsPerPage
      ? (internalOptions.currentPage = 1)
      : (internalOptions.currentPage = event.detail.currentPage)
    internalOptions.rowsPerPage = event.detail.rowsPerPage
    internalOptions = internalOptions

    if (dev) console.log(`DataTable: pagination changed to ${JSON.stringify(event.detail)}`)

    await render(true)
  }

  async function onSettingsVisibilityChanged() {
    settingsDialog.showModal()
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

  export async function updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>) {
    switch (dataType) {
      case DataType.File:
        const rowsToUpdateByWorkerIndex = [...rowsToUpdateByOriginalIndex].reduce<Map<number, Record<string, any>>>(
          (acc, [originalIndex, row]) => {
            acc.set(originalIndex, row) //swap the local index with the worker index
            return acc
          },
          new Map<number, Record<string, any>>()
        )
        await worker!.updateRows(rowsToUpdateByWorkerIndex)
        break
      case DataType.Matrix:
        for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
          const originalRow = (data as any[][])[originalIndex]
          for (const [column, value] of Object.entries(row)) {
            const index = internalColumns?.findIndex(c => c.id === column)
            originalRow[index!] = value
          }
        }
        break
      case DataType.ArrayOfObjects:
        for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
          Object.assign((data as any[])[originalIndex], row)
        }
        break
      default:
        throw new Error('Not yet supported')
    }

    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
      const renderedIndex = originalIndices.findIndex(i => i === originalIndex)
      if (renderedIndex !== -1) {
        const renderedRow = (renderedData as any[])[renderedIndex]
        for (const [column, value] of Object.entries(row)) {
          renderedRow[column] = value
        }
      }
    }
    renderedData = renderedData
  }

  export async function insertRows(rows: Record<string, any>[]): Promise<number[]> {
    let originalIndices: number[]
    switch (dataType) {
      case DataType.File:
        originalIndices = (await worker!.insertRows(rows)).indices
        break
      case DataType.Matrix:
        originalIndices = Array.from({ length: rows.length }, (_, i) => (data as any[][]).length + i)
        for (const row of rows) {
          ;(data as any[][]).push(
            internalColumns!.reduce((acc, column) => {
              acc.push(row[column.id])
              return acc
            }, [] as any[])
          )
        }
        break
      case DataType.ArrayOfObjects:
        originalIndices = Array.from({ length: rows.length }, (_, i) => (data as any[]).length + i)
        ;(data as any[]).push(...rows)
        break
      default:
        throw new Error('Not yet supported')
    }
    await render(false)
    return originalIndices
  }

  export async function deleteRows(originalIndices: number[]) {
    switch (dataType) {
      case DataType.File:
        await worker!.deleteRows(originalIndices)
        break
      case DataType.Matrix:
      case DataType.ArrayOfObjects:
        for (const originalIndex of originalIndices.sort((a, b) => b - a)) {
          ;(data as any[]).splice(originalIndex, 1)
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
        const row = (await worker!.getRow(originalIndices[index])).row
        return internalColumns!.reduce((acc, column, idx) => {
          acc[column.id!] = row[idx]
          return acc
        }, {} as Record<string, any>)
      case DataType.Matrix:
        return internalColumns!.reduce((acc, column, idx) => {
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

  export function setDisabled(value: boolean) {
    disabled = value
  }

  async function loadStoredOptions() {
    if (!internalOptions?.id || !browser) return

    const storedOptions = localStorage.getItem(`datatable_${internalOptions.id}_options`)
    if (storedOptions) {
      try {
        Object.assign(internalOptions, JSON.parse(storedOptions))
      } catch {}
    }
    const storedColumns = localStorage.getItem(`datatable_${internalOptions.id}_columns`)
    if (storedColumns) {
      try {
        const storedInternalColumns: Map<string, IColumnMetaData> = JSON.parse(storedColumns).reduce(
          (acc: Map<string, IColumnMetaData>, cur: IColumnMetaData) => {
            acc.set(cur.id, cur)
            return acc
          },
          new Map<string, IColumnMetaData>()
        )
        internalColumns = internalColumns?.map((col: IColumnMetaData) => {
          if (storedInternalColumns.has(col.id)) Object.assign(col, storedInternalColumns.get(col.id))
          return col
        })
      } catch {}
    }
  }

  function onStoreOptions() {
    if (!internalOptions?.id || !browser) return

    localStorage.setItem(`datatable_${internalOptions.id}_options`, JSON.stringify(internalOptions))
    if (internalColumns)
      localStorage.setItem(`datatable_${internalOptions.id}_columns`, JSON.stringify(internalColumns))
  }

  onDestroy(() => {
    worker?.destroy()
  })
</script>

<dialog data-name="settings-dialog" bind:this={settingsDialog}>
  <button data-name="close-button" on:click={() => settingsDialog.close()}
    ><SvgIcon href={iconsSvgUrl} id="x" width="16px" height="16px" /></button
  >
  <div class="modal-dialog">
    <h1>Change column visability:</h1>
    <div class="modal-body">
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
    </div>
  </div>
</dialog>

<div
  data-component="svelte-radar-datatable"
  data-status={renderStatus ?? ''}
  use:storeOptions
  on:storeoptions={onStoreOptions}
>
  <table>
    <thead>
      {#if visibleOrderedColumns}
        <tr data-name="titles">
          {#if internalOptions.actionColumn}
            <th data-name="action-Column" />
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
                on:columnPositionChanged={onColumnPositionChanged}
                on:columnWidthChanged={onColumnWidthChanged}
              >
                <p>{column.label || column.id}</p>
                {#if column.sortable !== false}
                  <ColumnSort
                    column={column.id}
                    sortDirection={column.sortDirection}
                    {disabled}
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
                on:columnPositionChanged={onColumnPositionChanged}
                on:columnWidthChanged={onColumnWidthChanged}
              >
                {#if column.filterable !== false}
                  <ColumnFilter
                    column={column.id}
                    inputType="text"
                    filter={column.filter}
                    {disabled}
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
              <Options on:settingsVisibilityChanged={onSettingsVisibilityChanged} {disabled} />
              <Pagination
                rowsPerPage={internalOptions.rowsPerPage}
                currentPage={internalOptions.currentPage}
                rowsPerPageOptions={internalOptions.rowsPerPageOptions}
                totalRows={internalOptions.totalRows ?? 0}
                {disabled}
                on:paginationChanged={onPaginationChanged}
              />
            </div>
          </th>
        </tr>
      {/if}
    </tfoot>
    <tbody>
      {#if renderedData}
        {#each renderedData as row, i (i)}
          <tr data-index={i}>
            {#if $$slots.default}
              <slot
                renderedRow={row}
                renderedIndex={i}
                originalIndex={originalIndices[i]}
                columns={visibleOrderedColumns}
                options={internalOptions}
              />
            {:else}
              {#if internalOptions.actionColumn}
                {#if $$slots.actionCell}
                  <slot
                    name="actionCell"
                    renderedRow={row}
                    renderedIndex={i}
                    originalIndex={originalIndices[i]}
                    columns={visibleOrderedColumns}
                    options={internalOptions}
                  />
                {:else}
                  <td />
                {/if}
              {/if}
              {#if visibleOrderedColumns}
                {#each visibleOrderedColumns as column, j (j)}
                  <td animate:flip={{ duration: 500 }}><p>{row[column.id]}</p></td>
                {/each}
              {/if}
            {/if}
          </tr>
        {/each}
      {:else if data}
        {#if $$slots.loading}
          <slot name="loading" />
        {:else}
          <div data-name="info">
            <Spinner />
            <p>Loading...</p>
          </div>
        {/if}
      {:else if $$slots.nodata}
        <slot name="nodata" />
      {:else}
        <div data-name="info">
          <p>No data...</p>
        </div>
      {/if}
    </tbody>
  </table>
</div>
