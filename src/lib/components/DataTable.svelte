<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { DEV, BROWSER } from 'esm-env'
  import { flip } from 'svelte/animate'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import isEqual from 'lodash.isequal'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { storeOptions } from '$lib/actions/storeOptions'
  import Spinner from '$lib/components/Spinner.svelte'
  import Options from '$lib/components/Options.svelte'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import ColumnSort from '$lib/components/ColumnSort.svelte'
  import ColumnResize from '$lib/components/ColumnResize.svelte'
  import ColumnFilter from '$lib/components/ColumnFilter.svelte'
  import { DataTypeFile } from '$lib/components/datatable/data/DataTypeFile'
  import { DataTypeMatrix } from '$lib/components/datatable/data/DataTypeMatrix'
  import { DataTypeArrayOfObjects } from '$lib/components/datatable/data/DataTypeArrayOfObjects'
  import type Query from 'arquero/dist/types/query/query'
  import type {
    ColumnFilterChangedED,
    ColumnPositionChangedED,
    ColumnSortChangedED,
    ColumnWidthChangedED,
    FetchDataFunc,
    IColumnMetaData,
    IDataTypeFunctionalities,
    ITableOptions,
    ModifyColumnMetadataFunc,
    PaginationChangedED,
  } from './DataTable'

  export let data: any[][] | any[] | FetchDataFunc | File | undefined,
    columns: IColumnMetaData[] | undefined = undefined,
    options: ITableOptions | undefined = undefined,
    disabled: boolean = false,
    modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined

  const defaultOptions = {
    currentPage: 1,
    rowsPerPage: 20,
    rowsPerPageOptions: [5, 10, 20, 50, 100],
    actionColumn: false,
    singleSort: false,
    defaultColumnWidth: 200,
  }

  let renderedData: any[][] | any[] | undefined,
    internalOptions: ITableOptions = Object.assign(defaultOptions, options ?? {}),
    internalColumns: IColumnMetaData[] | undefined

  let renderStatus: string
  let dataTypeImpl: IDataTypeFunctionalities
  let originalIndices: number[] //the index of the sorted, filtered and paginated record in the original data

  let settingsDialog: HTMLDialogElement
  let filterVisibility: boolean = !internalOptions.hideFilters

  const dispatch = createEventDispatcher()

  $: {
    options, columns, data
    init()
  }

  $: visibleOrderedColumns = internalColumns?.filter(col => col.visible !== false).sort((a, b) => a.position! - b.position!)

  async function init() {
    renderStatus = 'initializing'
    if (DEV) console.log(`DataTable: init ${options?.id}`)
    await configureSaveImpl()
    await configureOptions()
    await configureData()
    await configureColumns()
    await render()
    dispatch('initialized')
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
    await import('$lib/components/datatable/config/LocalstorageClass').then(({ default: LocalStorageOptions }) => {
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

  async function render(onlyPaginationChanged = false) {
    renderStatus = 'rendering'
    dispatch('rendering')
    if (DEV) console.log('DataTable: render')
    let totalRows: number | undefined
    if (!dataTypeImpl) return
    ;({ renderedData, originalIndices, totalRows, internalColumns } = await dataTypeImpl!.render(onlyPaginationChanged))
    internalOptions.totalRows = totalRows
    renderStatus = 'completed'
    dispatch('renderingComplete')
  }

  async function onColumnFilterChanged(event: CustomEvent<ColumnFilterChangedED>) {
    const { filter, column } = event.detail
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
    await render()
  }

  async function onColumnWidthChanged(event: CustomEvent<ColumnWidthChangedED>) {
    const { column, width } = event.detail
    const col = internalColumns?.find(col => col.id === column)
    if (col) col.width = width
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${col!.id}' width changed to '${width}'`)
  }

  async function onColumnPositionChanged(event: CustomEvent<ColumnPositionChangedED>) {
    const { column, position } = event.detail
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

  async function onColumnSortChanged(event: CustomEvent<ColumnSortChangedED>) {
    const { column, sortDirection } = event.detail
    if (internalOptions.singleSort) internalColumns?.forEach(col => (col.sortDirection = undefined))
    const internalCol = internalColumns?.find(col => col.id === column)
    if (!internalCol) return
    internalCol.sortDirection = sortDirection
    internalColumns = internalColumns
    if (DEV) console.log(`DataTable: column '${column}' sort changed to '${sortDirection}'`)
    internalOptions.currentPage = 1
    await render()
  }

  async function onPaginationChanged(event: CustomEvent<PaginationChangedED>) {
    const { rowsPerPage, currentPage } = event.detail
    if (rowsPerPage !== internalOptions.rowsPerPage) internalOptions.currentPage = 1
    else internalOptions.currentPage = currentPage
    internalOptions.rowsPerPage = rowsPerPage
    internalOptions = internalOptions
    if (DEV) console.log(`DataTable: pagination changed to ${JSON.stringify(event.detail)}`)
    await render(true)
  }

  const onSettingsVisibilityChanged = () => settingsDialog.showModal()

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
    await render(false)
    return originalIndices
  }

  export async function deleteRows(originalIndices: number[]) {
    await dataTypeImpl!.deleteRows(originalIndices)
    await render(false)
  }

  export const getColumns = () => internalColumns

  export async function getFullRow(originalIndex: number): Promise<Record<string, any>> {
    const fullRow = await dataTypeImpl?.getFullRow(originalIndex)
    if (!fullRow) throw new Error('Getting the full row did not work. Are you using a supported data method?')
    return fullRow
  }

  export async function getNextRow(currentIndex: number): Promise<Record<string, any>> {
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
    await render(false)
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
        const { tableOptions, columnMetaData } = await internalOptions.saveImpl.load(id, internalColumns)
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
    if (BROWSER && data && internalOptions.saveImpl) internalOptions.saveImpl.store(internalOptions, internalColumns!)
  }

  onDestroy(() => {
    if (dataTypeImpl) dataTypeImpl.destroy()
  })

  if (BROWSER) window.addEventListener('beforeunload', storeOptionsAndColumns, true)
  if (BROWSER && document) document.addEventListener('visibilitychange', storeOptionsAndColumns, true)
</script>

<dialog data-name="settings-dialog" bind:this={settingsDialog}>
  <div data-name="dialog-container" use:clickOutside on:outClick={closeModal}>
    <button data-name="close-button" on:click={() => settingsDialog.close()}>
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
              <input type="checkbox" name={id} {id} {checked} on:change={onColumnVisibilityChanged} />
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
    <div data-component="datatable-content" data-status={renderStatus ?? ''} use:storeOptions on:storeoptions={onStoreOptions}>
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
                      <Options on:settingsVisibilityChanged={onSettingsVisibilityChanged} {disabled} />
                    {/if}
                    {#if !hidePagination}
                      <Pagination
                        {rowsPerPage}
                        {currentPage}
                        {rowsPerPageOptions}
                        totalRows={totalRows ?? 0}
                        {disabled}
                        {paginationThroughArrowsOnly}
                        on:paginationChanged={onPaginationChanged}
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
                    <button on:click={toggleFilterVisibility}>
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
                  <ColumnResize {column} on:columnPositionChanged={onColumnPositionChanged} on:columnWidthChanged={onColumnWidthChanged}>
                    <p>{column.label || column.id}</p>
                    {#if column.sortable !== false}
                      <ColumnSort column={column.id} sortDirection={column.sortDirection} {disabled} on:columnSortChanged={onColumnSortChanged} />
                    {/if}
                  </ColumnResize>
                </th>
              {/each}
            </tr>
            {#if !hideFilters}
              <tr data-name="filters">
                {#if actionColumn}
                  {#if $$slots.actionHeader}
                    <slot name="actionHeader" columns={visibleOrderedColumns} options={internalOptions} />
                  {:else}
                    <th />
                  {/if}
                {/if}
                {#if globalFilter}
                  {#if filterVisibility}
                    {@const { column, filter } = globalFilter}
                    <th colspan={visibleOrderedColumns.length}>
                      <ColumnFilter column={column ?? 'all'} {inputType} {filter} {disabled} on:columnFilterChanged={onColumnFilterChanged} />
                    </th>
                  {/if}
                {:else}
                  {#each visibleOrderedColumns as column, i (column.id)}
                    {@const { resizable, id, filterable, filter } = column}
                    <th data-resizable={resizable} data-key={id} data-filterable={filterable} animate:flip={{ duration: 500 }}>
                      {#if filterVisibility === true && filterable !== false}
                        <ColumnFilter column={id} {inputType} {filter} {disabled} on:columnFilterChanged={onColumnFilterChanged} />
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
                      <Options on:settingsVisibilityChanged={onSettingsVisibilityChanged} {disabled} />
                    {/if}
                    {#if !hidePagination}
                      <Pagination
                        {rowsPerPage}
                        {currentPage}
                        {rowsPerPageOptions}
                        totalRows={totalRows ?? 0}
                        {disabled}
                        {paginationThroughArrowsOnly}
                        on:paginationChanged={onPaginationChanged}
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
                {#if $$slots.default}
                  <slot renderedRow={row} originalIndex={originalIndices[i]} index={i} columns={visibleOrderedColumns} options={internalOptions} />
                {:else}
                  {#if actionColumn}
                    {#if $$slots.actionCell}
                      <slot
                        name="actionCell"
                        renderedRow={row}
                        originalIndex={originalIndices[i]}
                        index={i}
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
              <tr data-name="loading" style="height: calc(var(--line-height) * {rowsPerPage})">
                <td colspan={(visibleOrderedColumns?.length ?? 1) + (actionColumn ? 1 : 0)}>
                  <div data-name="info">
                    <Spinner />
                    <p>Loading...</p>
                  </div>
                </td>
              </tr>
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
  </div>
{/if}
