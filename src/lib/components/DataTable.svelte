<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { DEV, BROWSER } from 'esm-env'
  import { flip } from 'svelte/animate'
  import { onDestroy, onMount, tick } from 'svelte'
  import { isEqual } from '../utils'
  import { clickOutside } from '../actions/clickOutside'
  import { storeOptions } from '../actions/storeOptions'
  import Spinner from '../components/Spinner.svelte'
  import Options from '../components/Options.svelte'
  import SvgIcon from '../components/SvgIcon.svelte'
  import Pagination from '../components/Pagination.svelte'
  import ColumnSort from '../components/ColumnSort.svelte'
  import ColumnResize from '../components/ColumnResize.svelte'
  import ColumnFilter from '../components/ColumnFilter.svelte'
  import { DataTypeFile } from '../helpers/DataTypeFile'
  import { DataTypeMatrix } from '../helpers/DataTypeMatrix'
  import { DataTypeArrayOfObjects } from '../helpers/DataTypeArrayOfObjects'
  import type Query from 'arquero/dist/types/query/query'
  import type { IColumnMetaData, IDataTypeFunctionalities, ITableOptions, SortDirection, TFilter, IDataTableProps, IRowNavigation } from '../interfaces/Types'
  import Settings from './datatable/Settings.svelte'
  import DataTable from '$lib/helpers/datatable/DataTable.svelte'
  import ColGroup from './datatable/ColGroup.svelte'
  import TableHead from './datatable/elements/TableHead.svelte'
  import dataClass from '../helpers/Data.svelte'
  import { getDataTable } from '$lib/stores/store.svelte'

  let {
    data,
    columns = undefined,
    options = $bindable(undefined),
    disabled = false,
    modifyColumnMetadata = undefined,
    initialized = undefined,
    rendering = undefined,
    rendered = undefined,
    paginationChanged = undefined,
    rowChild,
    actionHeaderChild,
    actionCellChild,
    loadingChild,
    noDataChild,
    addRowChild,
  }: IDataTableProps = $props()

  const defaultOptions = {
    currentPage: 1,
    rowsPerPage: 20,
    rowsPerPageOptions: [5, 10, 20, 50, 100],
    actionColumn: false,
    singleSort: false,
    defaultColumnWidth: 200,
  }

  let renderedData: any[][] | any[] | undefined = $state()
  let internalOptions: ITableOptions = $state(Object.assign(defaultOptions, options ?? {}))
  let internalColumns: IColumnMetaData[] | undefined = $state()

  let renderStatus: string = $state('')
  let dataTypeImpl: IDataTypeFunctionalities
  let originalIndices: number[] = $state([]) //the index of the sorted, filtered and paginated record in the original data

  let filterVisibility: boolean = $state(!options?.hideFilters ?? true)
  let visibleOrderedColumns = $derived(internalColumns?.filter(col => col.visible !== false).sort((a, b) => a.position! - b.position!))

  let initialisationCompleted = $state<boolean>(false)
  let reactiveTrigger: boolean = false

  let dataTable = $state<DataTable | undefined>(getDataTable().dataTable)

  onMount(async () => {
    await setup()
    await init()
    initialisationCompleted = true
    await tick()
    reactiveTrigger = true
  })

  $effect(() => {
    if (initialisationCompleted && reactiveTrigger) {
      options
      init()
    }
  })

  $effect(() => {
    if (initialisationCompleted && data && reactiveTrigger) init(true)
  })

  $effect(() => {
    if (initialisationCompleted && columns && reactiveTrigger) init(true)
  })

  async function setup() {
    const dt = new DataTable()
    getDataTable().setDataTable(dt)
    getDataTable().dataTable?.updateVariables({
      rendered: rendered,
      rendering: rendering,
      initialized: initialized,
      modifyColumnMetadata: modifyColumnMetadata,
      data: data,
      options: options,
      columns: columns,
    })
    await getDataTable().dataTable?.init()
  }

  async function init(reconfigureData: boolean = false) {
    renderStatus = 'initializing'
    if (DEV) console.log(`DataTable: init ${options?.id}`)
    await configureSaveImpl()
    await configureOptions()
    if (!initialisationCompleted || reconfigureData) await configureData(reconfigureData)
    await configureColumns()
    await render()
    if (initialized) initialized()
  }

  async function configureOptions() {
    const saveOptions = internalOptions.saveOptions !== false || options?.saveOptions !== false
    if (!isEqual(internalOptions, options) && saveOptions) {
      if (DEV) console.log('DataTable: Gather options & columns from the Save Implementation')
      ;({ internalOptions, internalColumns } = await loadStoredOptions())
    } else if (options) internalOptions = Object.assign(internalOptions, options)
  }

  async function configureSaveImpl() {
    if (internalOptions.saveImpl || !BROWSER) return
    if (options?.saveImpl) return (internalOptions.saveImpl = options.saveImpl)
    await import('../helpers/LocalstorageClass').then(({ default: LocalStorageOptions }) => {
      internalOptions.saveImpl = new LocalStorageOptions(options)
    })
  }

  async function configureData(reconfigure: boolean = false) {
    if (dataTypeImpl !== undefined && !reconfigure) return
    // Check the datatype impl internally
    if (internalOptions.dataTypeImpl) {
      if (!dataTypeImpl) dataTypeImpl = internalOptions.dataTypeImpl
      return await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    }
    // If there was no internal datatype, check the options
    if (options?.dataTypeImpl) {
      internalOptions.dataTypeImpl = options.dataTypeImpl
      if (!dataTypeImpl) dataTypeImpl = options.dataTypeImpl
      return await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    }
    // If there was no datatype provided, check if the data is a file
    if (data instanceof File) {
      if (!dataTypeImpl) dataTypeImpl = new DataTypeFile()
      return await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    }
    // If there was no datatype provided & the data is not a file, check if it's a matrix or array of objects
    if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
      if (!dataTypeImpl) dataTypeImpl = new DataTypeMatrix()
      return await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    } else if (Array.isArray(data) && data.length && typeof data[0] === 'object') {
      if (!dataTypeImpl) dataTypeImpl = new DataTypeArrayOfObjects()
      return await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    }
    // The data was invalid
    renderStatus = ''
    renderedData = undefined
  }

  async function configureColumns() {
    if (!dataTypeImpl) return
    if (!internalColumns) internalColumns = await dataTypeImpl.setInternalColumns(columns)
    else internalColumns = await dataTypeImpl.setInternalColumns(internalColumns)
  }

  export async function render(onlyPaginationChanged = false) {
    renderStatus = 'rendering'
    if (rendering) await rendering()
    if (DEV) console.log('DataTable: render')
    let totalRows: number | undefined
    if (!dataTypeImpl) return
    ;({ renderedData, originalIndices, totalRows, internalColumns } = await dataTypeImpl!.render(onlyPaginationChanged))
    internalOptions.totalRows = totalRows
    renderStatus = 'completed'
    if (rendered) rendered()
  }

  async function onPaginationChanged(rowsPerPage: number, currentPage: number) {
    if (rowsPerPage !== internalOptions.rowsPerPage) internalOptions.currentPage = 1
    else internalOptions.currentPage = currentPage
    internalOptions.rowsPerPage = rowsPerPage
    internalOptions = internalOptions
    if (paginationChanged) await paginationChanged(currentPage, rowsPerPage)
    await render(true)
  }

  export const saveToFile = async () => await dataTypeImpl!.saveToFile()
  export const getBlob = async (): Promise<Blob | undefined> => {
    if (!dataTypeImpl) return
    return await dataTypeImpl!.getBlob()
  }
  export const getData = async () => dataTypeImpl!.data

  export async function updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>) {
    await dataTypeImpl!.updateRows(rowsToUpdateByOriginalIndex)

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
    const indices = await dataTypeImpl!.insertRows(rows)
    if (typeof indices == 'number') originalIndices = indices
    await render()
    return originalIndices
  }

  export async function deleteRows(originalIndices: number[]) {
    await dataTypeImpl!.deleteRows(originalIndices)
    await render()
  }

  export const getColumns = () => internalColumns

  export async function getFullRow(originalIndex: number): Promise<Record<string, any>> {
    const fullRow = await dataTypeImpl?.getFullRow(originalIndex)
    if (!fullRow) throw new Error('Getting the full row did not work. Are you using a supported data method?')
    return fullRow
  }

  export async function getNextRow(currentIndex: number): Promise<IRowNavigation> {
    const { rowsPerPage, currentPage } = internalOptions
    return await dataTypeImpl?.getNextRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  export async function getPreviousRow(currentIndex: number): Promise<Record<string, any>> {
    const { rowsPerPage, currentPage } = internalOptions
    return await dataTypeImpl?.getPreviousRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  export async function insertColumns(cols: IColumnMetaData[]) {
    const updatedColumns = await dataTypeImpl!.insertColumns(cols)
    if (updatedColumns) internalColumns = updatedColumns
    await render()
  }

  export async function updateColumns(cols: IColumnMetaData[]) {
    if (!internalColumns) return
    for (let col of cols) {
      const index = internalColumns.findIndex(column => column.id == col.id)
      if (index === -1) throw new Error(`Column with id ${col.id} doesn't exist`)
      else Object.assign(internalColumns[index], col)
    }
    internalColumns = internalColumns
  }

  export async function executeQueryAndReturnResults(query: Query | object) {
    return await dataTypeImpl.executeQueryAndReturnResults(query)
  }

  export async function executeExpressionsAndReturnResults(expressions: Record<string, any>) {
    return await dataTypeImpl.executeExpressionsAndReturnResults(expressions)
  }

  export function getTablePagination() {
    const { currentPage, rowsPerPage, totalRows } = internalOptions
    return { currentPage, rowsPerPage, totalRows }
  }

  export function changePagination(pag: { currentPage?: number; rowsPerPage?: number }) {
    if (pag.currentPage) internalOptions.currentPage = pag.currentPage
    if (pag.rowsPerPage) internalOptions.rowsPerPage = pag.rowsPerPage
    internalOptions = internalOptions
    render(true)
  }

  export const setDisabled = (value: boolean) => (disabled = value)

  export async function replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string) {
    await dataTypeImpl.replaceValuesOfColumn(currentValue, updatedValue, column)
  }

  export async function renameColumns(columns: Record<string, string>) {
    await dataTypeImpl.renameColumns(columns)
    await render()
  }

  export async function triggerOptionsAndColumnsSave() {
    if (DEV) console.log('triggerOptionsAndColumnsSave: Storing options ', internalOptions.saveImpl, ' And columns ', internalColumns)
    if (BROWSER && internalOptions.saveImpl) internalOptions.saveImpl.store(internalOptions, internalColumns!)
  }

  function onStoreOptions() {
    if (DEV) console.log('onStoreOptions: Storing options ', internalOptions.saveImpl)
    if (BROWSER && internalOptions.saveImpl) internalOptions.saveImpl.store(internalOptions, internalColumns!)
  }

  async function loadStoredOptions() {
    let cols: IColumnMetaData[] | undefined
    if (BROWSER && internalOptions?.saveImpl) {
      const id = options ? options.id : internalOptions.id
      if (id) {
        if (DEV) console.log(`loadStoredOptions: Loading options & columns for ${id}`)
        const { tableOptions, columnMetaData } = await internalOptions.saveImpl.load(id, columns)
        if (columnMetaData) cols = columnMetaData
        else cols = columns
        if (tableOptions) Object.assign(internalOptions, tableOptions)
        else if (options) Object.assign(internalOptions, options)
      }
    } else Object.assign(internalOptions, options)
    return {
      internalOptions,
      internalColumns: cols,
    }
  }

  function storeOptionsAndColumns() {
    if (DEV) console.log('storeOptionsAndColumns: Storing options ', internalOptions.saveImpl, ' And columns ', internalColumns)
    if (BROWSER && data && internalOptions.saveImpl) internalOptions.saveImpl.store(internalOptions, internalColumns!)
  }

  if (BROWSER) window.addEventListener('beforeunload', storeOptionsAndColumns, true)
  if (BROWSER && document) document.addEventListener('visibilitychange', storeOptionsAndColumns, true)

  onDestroy(() => {
    // window.removeEventListener('beforeunload', storeOptionsAndColumns, true)
    // document.removeEventListener('visibilitychange', storeOptionsAndColumns, true)
    if (dataTypeImpl) dataTypeImpl.destroy()
  })
</script>

{#if internalOptions}
  {@const { actionColumn, paginationOnTop, rowsPerPage, currentPage, rowsPerPageOptions, totalRows } = internalOptions}
  {@const { singleSort, globalFilter, paginationThroughArrowsOnly, hidePagination, hideOptions, hideFilters } = internalOptions}
  {@const inputType = 'text'}
  <div data-component="svelte-datatable">
    <div data-component="datatable-content" data-status={renderStatus ?? ''} use:storeOptions onstoreoptions={onStoreOptions}>
      <table>
        {#if visibleOrderedColumns}
          <ColGroup />
          <TableHead />
          {#if !hidePagination || !hideOptions}
            <tfoot>
              <tr data-name="pagination">
                <th colspan={visibleOrderedColumns.length + (actionColumn ? 1 : 0)}>
                  <div>
                    <!-- {#if !hideOptions}
                      <Settings bind:internalColumns {disabled} />
                    {/if} -->
                    {#if !hidePagination}
                      <Pagination
                        {rowsPerPage}
                        {currentPage}
                        {rowsPerPageOptions}
                        totalRows={totalRows ?? 0}
                        {disabled}
                        {paginationThroughArrowsOnly}
                        changePagination={onPaginationChanged}
                      />
                    {/if}
                  </div>
                </th>
              </tr>
            </tfoot>
          {/if}
        {/if}
        <tbody>
          {#if dataClass.renderedData}
            {#if internalOptions.addRow === 'top' && addRowChild}
              {@render addRowChild(visibleOrderedColumns, internalOptions)}
            {/if}
            {#each dataClass.renderedData as row, i (i)}
              <tr data-index={i}>
                {#if rowChild}
                  {@render rowChild(row, originalIndices[i], i, visibleOrderedColumns, internalOptions)}
                {:else}
                  {#if actionColumn}
                    {#if actionCellChild}
                      {@render actionCellChild(row, originalIndices[i], i, visibleOrderedColumns, internalOptions)}
                    {:else}
                      <!-- svelte-ignore element_invalid_self_closing_tag -->
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
            {#if internalOptions.addRow === 'bottom' && addRowChild}
              {@render addRowChild(visibleOrderedColumns, internalOptions)}
            {/if}
          {:else if data}
            {#if loadingChild}
              {@render loadingChild()}
            {:else}
              <tr data-name="loading" style="height: calc(var(--line-height) * {rowsPerPage})">
                <td colspan={(visibleOrderedColumns?.length ?? 1) + (actionColumn ? 1 : 0)}>
                  <div data-name="info">
                    <Spinner />
                    <p>Loading...</p>
                  </div>
                </td>
              </tr>
            {/if}
          {:else if noDataChild}
            {@render noDataChild()}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
{/if}
