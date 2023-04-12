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
    type IPagination,
    DataType,
  } from './DataTable.d'
  import ColumnSort from './ColumnSort.svelte'
  import ColumnResize from './ColumnResize.svelte'
  import ColumnFilter from './ColumnFilter.svelte'
  import Pagination from './Pagination.svelte'
  import Spinner from './Spinner.svelte'
  import { jsonMapReplacer } from '$lib/utils'
  import { dev } from '$app/environment'
  import { onMount, onDestroy } from 'svelte'
  import { DataTableWorker } from './DataTableWorker'

  export let data: any[][] | any[] | FetchDataFunc | File | undefined,
    columns: IColumnMetaData[] | undefined = undefined,
    options: ITableOptions | undefined = undefined

  let mounted = false
  let renderedData: any[][] | any[] | undefined,
    filteredAndSortedData: any[][] | any[] | undefined,
    internalOptions: ITableOptions = {
      rowsPerPageOptions: [5, 10, 20, 50, 100],
    },
    internalColumns: IColumnMetaData[] | undefined

  let columnIds: string[], visibleColumns: string[], columnPositions: string[]
  let totalRows: number
  let sortedColumns = new Map<string, SortDirection>(),
    filteredColumns = new Map<string, TFilter>(),
    pagination: IPagination = {
      currentPage: 1,
      rowsPerPage: 20,
    }

  let dataType: DataType | undefined = undefined

  let worker: DataTableWorker | undefined

  $: {
    options, columns, data
    init()
  }
  $: visibleOrderedColumns = internalColumns
    ?.filter(col => visibleColumns?.includes(col.id) || true)
    .sort((a, b) => (columnPositions?.indexOf(a.id) || 0) - (columnPositions?.indexOf(b.id) || 0))
  $: visibleOrderedColumnsOriginalColumnPosition = visibleOrderedColumns?.map(col =>
    dataType === DataType.Matrix || dataType === DataType.File ? columnIds.indexOf(col.id) : col.id
  )

  async function init() {
    if (dev) console.log('init')

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
      let start: number
      if (dev) start = performance.now()
      const url = URL.createObjectURL(data as File)
      if (dev) {
        const end = performance.now()
        console.log(`URL.createObjectURL took: ${Math.round(end - start!)} ms`)
      }
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
        internalColumns = Object.keys((data as any[])[0]).map(key => ({
          id: key,
        }))
      } else if (dataType === DataType.File) {
        //get columns from worker
        internalColumns = (await worker!.getColumnNames()).map(key => ({
          id: key,
        }))
      } else throw new Error('Columns property is not provided')
    } else {
      internalColumns = []
      Object.assign(internalColumns, columns)
    }
    columnIds = internalColumns!.map(col => col.id)

    //VISABILITY
    visibleColumns = []
    internalColumns!
      .reduce<IColumnMetaData[]>((acc, cur, i) => {
        if (cur && cur.visible !== false) acc.push(cur)
        return acc
      }, [])
      .forEach(col => visibleColumns.push(col.id))

    //POSITION
    columnPositions = []
    internalColumns!.sort((a, b) => (a.position || 0) - (b.position || 0)).forEach(col => columnPositions.push(col.id))

    //SORT
    sortedColumns.clear()
    internalColumns!
      .reduce<IColumnMetaData[]>((acc, cur, i) => {
        if (cur && cur.sortDirection) acc.push(cur)
        return acc
      }, [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach(col => sortedColumns.set(col.id, col.sortDirection))

    //FILTER
    filteredColumns.clear()
    internalColumns!
      .reduce<IColumnMetaData[]>((acc, cur, i) => {
        if (cur && cur.filter) acc.push(cur)
        return acc
      }, [])
      .forEach(col => filteredColumns.set(col.id, col.filter))

    //PAGINATION
    pagination = {
      currentPage: 1,
      rowsPerPage: 20,
    }

    await render()
  }

  async function render(onlyPaginationChanged = false) {
    if (dev) console.log('render')
    renderedData = undefined
    if (dataType === DataType.Function) {
      let start: number
      if (dev) start = performance.now()
      const results = await (data as FetchDataFunc)(filteredColumns, sortedColumns, pagination)
      if (dev) {
        const end = performance.now()
        console.log(`Data function took: ${Math.round(end - start!)} ms`)
      }
      totalRows = results.totalRows
      renderedData = results.data
    } else if (dataType === DataType.Matrix || dataType === DataType.ArrayOfObjects) {
      if (!onlyPaginationChanged || !filteredAndSortedData) {
        filteredAndSortedData = applySort(applyFilter(data as any[][] | any[]))
        totalRows = filteredAndSortedData.length
      }
      renderedData = applyPagination(filteredAndSortedData)
    } else if (dataType === DataType.File) {
      const results = await worker?.fetchData(filteredColumns, sortedColumns, pagination, onlyPaginationChanged)
      totalRows = results!.totalRows
      renderedData = results!.data
    }
  }

  function applyFilter(data: any[][] | any[]): any[][] | any[] {
    for (const [column, filter] of [...filteredColumns].values()) {
      if (dev) console.log(`Applying filter '${filter}' on column '${column}'`)
      if (dataType === DataType.Matrix) {
        const columnIndex = columnIds.indexOf(column)
        data = data.filter(row => row[columnIndex]?.toString()?.toLowerCase().indexOf(filter) > -1)
      } else if (dataType === DataType.ArrayOfObjects) {
        data = data.filter(obj => obj[column]?.toString()?.toLowerCase().indexOf(filter) > -1)
      }
    }
    return data
  }

  function applySort(data: any[][] | any[]): any[][] | any[] {
    //TODO: ignore case, use localCompare for strings, convert Dates to milliseconds using .getTime()
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    for (let [column, sortDirection] of [...sortedColumns].reverse()) {
      //Sort is applied in reverse order !!!
      if (dev) console.log(`Applying sort order '${sortDirection}' on column '${column}'`)
      if (dataType === DataType.Matrix) {
        const columnIndex = columnIds.indexOf(column)
        switch (sortDirection) {
          case 'asc':
            compareFn = (a, b) => (a[columnIndex] < b[columnIndex] ? -1 : a[columnIndex] > b[columnIndex] ? 1 : 0)
            break
          case 'desc':
            compareFn = (a, b) => (b[columnIndex] < a[columnIndex] ? -1 : b[columnIndex] > a[columnIndex] ? 1 : 0)
            break
        }
      } else if (dataType === DataType.ArrayOfObjects) {
        switch (sortDirection) {
          case 'asc':
            compareFn = (a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0)
            break
          case 'desc':
            compareFn = (a, b) => (b[column] < a[column] ? -1 : b[column] > a[column] ? 1 : 0)
            break
        }
      }
      data = data.sort(compareFn)
    }
    return data
  }

  function applyPagination(data: any[][] | any[]): any[][] | any[] {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage
    const end = pagination.currentPage * pagination.rowsPerPage
    if (dev) console.log(`Applying pagination row ${start} - ${end}`)
    data = data.slice(start, end)
    return data
  }

  async function onColumnFilterChanged(event: CustomEvent<ColumnFilterChangedEventDetail>) {
    if (!event.detail.filter) filteredColumns.delete(event.detail.column)
    else filteredColumns.set(event.detail.column, event.detail.filter)
    filteredColumns = filteredColumns
    filteredAndSortedData = undefined

    if (dev) console.log(`filter changed: ${JSON.stringify(filteredColumns, jsonMapReplacer)}`)

    pagination.currentPage = 1
    await render()
  }

  async function onColumnSortChanged(event: CustomEvent<ColumnSortChangedEventDetail>) {
    if (!event.detail.sortDirection) sortedColumns.delete(event.detail.column)
    else sortedColumns.set(event.detail.column, event.detail.sortDirection)
    sortedColumns = sortedColumns
    filteredAndSortedData = undefined

    if (dev) console.log(`Sort changed: ${JSON.stringify(sortedColumns, jsonMapReplacer)}`)

    pagination.currentPage = 1
    await render()
  }

  async function onPaginationChanged(event: CustomEvent<PaginationChangedEventDetail>) {
    pagination.rowsPerPage = event.detail.rowsPerPage
    pagination.currentPage = event.detail.currentPage
    pagination = pagination

    if (dev) console.log(`Pagination changed: ${JSON.stringify(event.detail)}`)

    await render(true)
  }

  onMount(() => {
    mounted = true
  })

  onDestroy(() => {
    worker?.destroy()
  })
</script>

<div data-component="RADar-DataTable">
  <div data-name="table-container">
    <table>
      <thead>
        {#if visibleOrderedColumns}
          <tr data-name="titles">
            {#each visibleOrderedColumns as column, i (column.id)}
              <th>
                <ColumnResize resizable={column.resizable || (true && i < visibleOrderedColumns.length - 1)}>
                  <p>{column.label || column.id}</p>
                  {#if column.sortable !== false}
                    <ColumnSort
                      column={column.id}
                      sortDirection={sortedColumns.get(column.id)}
                      on:columnSortChanged={onColumnSortChanged}
                    />
                  {/if}
                </ColumnResize>
              </th>
            {/each}
          </tr>
          <tr data-name="filters">
            {#each visibleOrderedColumns as column, i (column.id)}
              <th>
                <ColumnResize resizable={column.resizable || (true && i < visibleOrderedColumns.length - 1)}>
                  {#if column.filterable !== false}
                    <ColumnFilter
                      column={column.id}
                      inputType="text"
                      filter={filteredColumns.get(column.id)}
                      on:columnFilterChanged={onColumnFilterChanged}
                    />
                  {:else}
                    <input class="hidden" />
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
            <th colspan={visibleOrderedColumns.length}>
              <div>
                {#if mounted}
                  <Pagination
                    rowsPerPage={pagination.rowsPerPage}
                    currentPage={pagination.currentPage}
                    rowsPerPageOptions={internalOptions.rowsPerPageOptions}
                    {totalRows}
                    on:paginationChanged={onPaginationChanged}
                  />
                {/if}
              </div>
            </th>
          </tr>
        {/if}
      </tfoot>
      <tbody>
        {#if renderedData && visibleOrderedColumnsOriginalColumnPosition}
          {#each renderedData as row}
            {#if $$slots.row}
              <slot
                name="row"
                row={visibleOrderedColumnsOriginalColumnPosition.map(index => row[index])}
                columns={visibleOrderedColumns}
              />
            {:else}
              <tr>
                {#each visibleOrderedColumnsOriginalColumnPosition as index}
                  <td>{row[index]}</td>
                {/each}
              </tr>
            {/if}
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

<style>
  .hidden {
    visibility: hidden;
  }
</style>
