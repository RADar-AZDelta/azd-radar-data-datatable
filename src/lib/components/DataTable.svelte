<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { DEV, BROWSER } from 'esm-env'
  import { flip } from 'svelte/animate'
  import { onDestroy } from 'svelte'
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

  let settingsDialog: HTMLDialogElement
  let filterVisibility: boolean = $state(!options?.hideFilters ?? true)
  let visibleOrderedColumns = $derived(internalColumns?.filter(col => col.visible !== false).sort((a, b) => a.position! - b.position!))

  $effect(() => {
    options
    columns
    data
    init()
  })

  async function init() {
    renderStatus = 'initializing'
    if (DEV) console.log(`DataTable: init ${options?.id}`)
    await configureSaveImpl()
    await configureOptions()
    await configureData()
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

  async function configureData() {
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

  async function updateColumnFilter(column: string, filter: TFilter) {
    if (internalOptions?.globalFilter) internalOptions.globalFilter.filter = filter
    const filterString = filter ? filter.toString().toLowerCase() : ''
    if (column === 'all') internalColumns?.forEach(column => (column!.filter = filterString))
    else {
      const col = internalColumns?.find(col => col.id === column)
      if (col) col.filter = filterString
    }
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${column}' filter changed to '${filter}'`)
    internalOptions.currentPage = 1
    await configureColumns()
    await render()
  }

  async function changeColumnWidth(column: string, width: number) {
    const col = internalColumns?.find(col => col.id === column)
    if (col) col.width = width
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${col!.id}' width changed to '${width}'`)
  }

  async function changeColumnPosition(column: string, position: number) {
    const sourceColumn = internalColumns?.find(col => col.id === column)
    if (!sourceColumn) return
    internalColumns?.forEach(col => {
      const colPos = col.position ?? 0
      const sourcePos = sourceColumn.position ?? 0
      if (col.id === column) col.position = position
      else if (sourcePos < colPos && colPos <= position) col.position = colPos - 1
      else if (position <= colPos && colPos < sourcePos) col.position = colPos + 1
    })
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${sourceColumn!.id}' position changed from '${sourceColumn?.position}' to '${position}'`)
  }

  async function changeColumnSort(column: string, sortDirection: SortDirection) {
    if (internalOptions.singleSort) internalColumns?.forEach(col => (col.sortDirection = undefined))
    const internalCol = internalColumns?.find(col => col.id === column)
    if (!internalCol) return
    internalCol.sortDirection = sortDirection
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${column}' sort changed to '${sortDirection}'`)
    internalOptions.currentPage = 1
    await configureColumns()
    await render()
  }

  async function onPaginationChanged(rowsPerPage: number, currentPage: number) {
    if (rowsPerPage !== internalOptions.rowsPerPage) internalOptions.currentPage = 1
    else internalOptions.currentPage = currentPage
    internalOptions.rowsPerPage = rowsPerPage
    internalOptions = internalOptions
    if (paginationChanged) await paginationChanged(currentPage, rowsPerPage)
    await render(true)
  }

  async function changeVisibility() {
    settingsDialog.showModal()
  }

  async function onColumnVisibilityChanged(e: Event) {
    const inputEl = e.target as HTMLInputElement
    if (!internalColumns) return
    const columns = internalColumns.find(col => col.id === inputEl.name)
    if (!columns) return
    columns.visible = inputEl.checked
    internalColumns = internalColumns
  }

  export const saveToFile = async () => await dataTypeImpl!.saveToFile()
  export const getBlob = async () => await dataTypeImpl!.getBlob()
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

  function toggleFilterVisibility() {
    filterVisibility = !filterVisibility
    if (columns) for (let col of columns) col.filterable = filterVisibility
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

  const closeModal = () => settingsDialog.close()

  function storeOptionsAndColumns() {
    if (DEV) console.log('storeOptionsAndColumns: Storing options ', internalOptions.saveImpl, ' And columns ', internalColumns)
    if (BROWSER && data && internalOptions.saveImpl) internalOptions.saveImpl.store(internalOptions, internalColumns!)
  }

  onDestroy(() => {
    if (dataTypeImpl) dataTypeImpl.destroy()
  })

  if (BROWSER) window.addEventListener('beforeunload', storeOptionsAndColumns, true)
  if (BROWSER && document) document.addEventListener('visibilitychange', storeOptionsAndColumns, true)
</script>

<dialog data-name="settings-dialog" bind:this={settingsDialog}>
  <div data-name="dialog-container" use:clickOutside onoutClick={closeModal}>
    <button data-name="close-button" onclick={() => settingsDialog.close()}>
      <SvgIcon id="x" />
    </button>
    <div data-name="modal-dialog">
      <h1>Change column visibility:</h1>
      <div data-name="modal-body">
        {#if internalColumns}
          {#each internalColumns.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as column}
            {@const { id, visible, label } = column}
            {@const checked = visible === undefined ? true : visible}
            <div>
              <input type="checkbox" name={id} {id} {checked} onchange={onColumnVisibilityChanged} />
              <label for={id}>{label ?? id}</label><br />
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</dialog>

{#if internalOptions}
  {@const { actionColumn, paginationOnTop, rowsPerPage, currentPage, rowsPerPageOptions, totalRows } = internalOptions}
  {@const { singleSort, globalFilter, paginationThroughArrowsOnly, hidePagination, hideOptions, hideFilters } = internalOptions}
  {@const inputType = 'text'}
  <div data-component="svelte-datatable">
    <div data-component="datatable-content" data-status={renderStatus ?? ''} use:storeOptions onstoreoptions={onStoreOptions}>
      <table>
        {#if visibleOrderedColumns}
          <colgroup>
            {#if actionColumn}
              <col data-name="col-action" width="0*" />
            {/if}
            {#each visibleOrderedColumns as column, i (column.id)}
              <col width={column.width ?? '0*'} />
            {/each}
          </colgroup>
          <thead>
            {#if paginationOnTop && (!hideOptions || !hidePagination)}
              <tr data-name="pagination">
                <th colspan={visibleOrderedColumns.length + (actionColumn ? 1 : 0)}>
                  <div>
                    {#if !hideOptions}
                      <Options {disabled} {changeVisibility} />
                    {/if}
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
            {/if}
            <tr data-name="titles">
              {#if actionColumn}
                <th data-name="action-Column">
                  {#if singleSort}
                    <button onclick={toggleFilterVisibility}>
                      <SvgIcon id="filter" />
                    </button>
                  {/if}
                </th>
              {/if}
              {#each visibleOrderedColumns as column, i (column.id)}
                <th
                  title={column.id}
                  data-direction={column?.sortDirection}
                  data-resizable={column?.resizable}
                  data-key={column?.id}
                  data-sortable={column?.sortable}
                  animate:flip={{ duration: 500 }}
                >
                  <ColumnResize {column} {changeColumnPosition} {changeColumnWidth}>
                    {#snippet child()}
                      <p>{column.label || column.id}</p>
                      {#if column.sortable !== false}
                        <ColumnSort column={column.id} sortDirection={column.sortDirection} {disabled} {changeColumnSort} />
                      {/if}
                    {/snippet}
                  </ColumnResize>
                </th>
              {/each}
            </tr>
            {#if !hideFilters}
              <tr data-name="filters">
                {#if actionColumn}
                  {#if actionHeaderChild}
                    {@render actionHeaderChild(visibleOrderedColumns, internalOptions)}
                  {:else}
                    <!-- svelte-ignore element_invalid_self_closing_tag -->
                    <th />
                  {/if}
                {/if}
                {#if globalFilter}
                  {#if filterVisibility}
                    {@const { column, filter } = globalFilter}
                    <th colspan={visibleOrderedColumns.length}>
                      <ColumnFilter column={column ?? 'all'} {inputType} {filter} {disabled} {updateColumnFilter} />
                    </th>
                  {/if}
                {:else}
                  {#each visibleOrderedColumns as column, i (column.id)}
                    {@const { resizable, id, filterable, filter } = column}
                    <th data-resizable={resizable} data-key={id} data-filterable={filterable} animate:flip={{ duration: 500 }}>
                      {#if filterVisibility === true && filterable !== false}
                        <ColumnFilter column={id} {inputType} {filter} {disabled} {updateColumnFilter} />
                      {/if}
                    </th>
                  {/each}
                {/if}
              </tr>
            {/if}
          </thead>
          {#if !hidePagination || !hideOptions}
            <tfoot>
              <tr data-name="pagination">
                <th colspan={visibleOrderedColumns.length + (actionColumn ? 1 : 0)}>
                  <div>
                    {#if !hideOptions}
                      <Options {changeVisibility} {disabled} />
                    {/if}
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
          {#if renderedData}
            {#each renderedData as row, i (i)}
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
            {#if internalOptions.addRow}
              {#if addRowChild}
                {@render addRowChild(visibleOrderedColumns, internalOptions)}
              {/if}
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
