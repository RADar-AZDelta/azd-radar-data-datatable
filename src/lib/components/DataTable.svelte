<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import ColumnSort from '$lib/components/ColumnSort.svelte'
  import ColumnResize from '$lib/components/ColumnResize.svelte'
  import ColumnFilter from '$lib/components/ColumnFilter.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import Spinner from '$lib/components/Spinner.svelte'
  import { dev } from '$app/environment'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import type Query from 'arquero/dist/types/query/query'
  import Options from './Options.svelte'
  import { flip } from 'svelte/animate'
  import { storeOptions } from '$lib/actions/storeOptions'
  import { browser } from '$app/environment'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { DataTypeArrayOfObjects } from '$lib/components/datatable/data/DataTypeArrayOfObjects'
  import { DataTypeFile } from '$lib/components/datatable/data/DataTypeFile'
  import { DataTypeMatrix } from '$lib/components/datatable/data/DataTypeMatrix'
  import type {
    ColumnFilterChangedEventDetail,
    ColumnPositionChangedEventDetail,
    ColumnSortChangedEventDetail,
    ColumnWidthChangedEventDetail,
    FetchDataFunc,
    IColumnMetaData,
    IDataTypeFunctionalities,
    ITableOptions,
    ModifyColumnMetadataFunc,
    PaginationChangedEventDetail,
  } from './DataTable'
  // @ts-ignore
  import isEqual from 'lodash.isequal'

  export let data: any[][] | any[] | FetchDataFunc | File | undefined,
    columns: IColumnMetaData[] | undefined = undefined,
    options: ITableOptions | undefined = undefined,
    disabled: boolean = false,
    modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined

  let renderedData: any[][] | any[] | undefined,
    internalOptions: ITableOptions = {
      currentPage: 1,
      rowsPerPage: 20,
      rowsPerPageOptions: [5, 10, 20, 50, 100],
      actionColumn: false,
      singleSort: false,
      defaultColumnWidth: 200,
    },
    internalColumns: IColumnMetaData[] | undefined

  let renderStatus: string
  let dataTypeImpl: IDataTypeFunctionalities
  let originalIndices: number[] //the index of the sorted, filtered and paginated record in the original data

  let settingsDialog: HTMLDialogElement
  let filterVisibility: boolean = true

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
    if (dev) console.log(`DataTable: init ${options?.id}`)

    //OPTIONS
    if (!internalOptions.saveImpl && browser) {
      if (!options?.saveImpl) {
        await import('$lib/components/datatable/config/LocalstorageClass').then(({ default: LocalStorageOptions }) => {
          internalOptions.saveImpl = new LocalStorageOptions(options)
        })
      } else {
        internalOptions.saveImpl = options.saveImpl
      }
    }

    if (
      !isEqual(internalOptions, options) &&
      (internalOptions?.saveOptions !== false || options?.saveOptions !== false)
    ) {
      if (dev) console.log('DataTable: Gather options & columns from the Save Implementation')
      ;({ internalOptions, internalColumns } = await loadStoredOptions())
    } else if (options) internalOptions = Object.assign(internalOptions, options)

    //DATA
    if (!internalOptions.dataTypeImpl) {
      if (!options?.dataTypeImpl) {
        if (data && Array.isArray(data) && data.length > 0 && typeof data === 'object') {
          if (Array.isArray(data[0])) {
            if (!dataTypeImpl) dataTypeImpl = new DataTypeMatrix()
            await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
          } else if (typeof data[0] === 'object') {
            if (!dataTypeImpl) dataTypeImpl = new DataTypeArrayOfObjects()
            await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
          }
        } else if (data instanceof File) {
          if (!dataTypeImpl) dataTypeImpl = new DataTypeFile()
          await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
        } else {
          renderStatus = ''
          renderedData = undefined
          return
        }
      } else {
        internalOptions.dataTypeImpl = options.dataTypeImpl
        if (!dataTypeImpl) dataTypeImpl = options.dataTypeImpl
        await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
      }
    } else {
      if (!dataTypeImpl) dataTypeImpl = internalOptions.dataTypeImpl
      await dataTypeImpl.setData({ data, internalOptions, internalColumns, renderedData, modifyColumnMetadata })
    }
    //COLUMNS:
    if (!internalColumns) internalColumns = await dataTypeImpl!.setInternalColumns(columns)
    else internalColumns = await dataTypeImpl!.setInternalColumns(internalColumns)
    await render()
    dispatch('initialized')
  }

  async function render(onlyPaginationChanged = false) {
    renderStatus = 'rendering'
    dispatch('rendering')
    if (dev) console.log('DataTable: render')
    renderedData = undefined
    let totalRows: number | undefined
    if (dataTypeImpl) {
      ;({ renderedData, originalIndices, totalRows, internalColumns } = await dataTypeImpl!.render(
        onlyPaginationChanged
      ))
    }
    internalOptions.totalRows = totalRows
    renderStatus = 'completed'
    dispatch('renderingComplete')
  }

  async function onColumnFilterChanged(event: CustomEvent<ColumnFilterChangedEventDetail>) {
    if (internalOptions?.globalFilter)
      internalOptions.globalFilter!.filter = event.detail.filter?.toString().toLowerCase()

    if (event.detail.column === 'all')
      internalColumns?.forEach(column => (column!.filter = event.detail.filter?.toString().toLowerCase()))
    else {
      const column = internalColumns?.find(col => col.id === event.detail.column)
      column!.filter = event.detail.filter?.toString().toLowerCase()
    }
    internalColumns = internalColumns

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
    if (internalOptions.singleSort) {
      internalColumns?.forEach(col => (col.sortDirection = undefined))
    }
    const column = internalColumns?.find(col => col.id === event.detail.column)
    column!.sortDirection = event.detail.sortDirection
    internalColumns = internalColumns
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
    internalColumns!.find(col => col.id == inputEl.name)!.visible = inputEl.checked
    internalColumns = internalColumns
  }

  export async function saveToFile() {
    await dataTypeImpl!.saveToFile()
  }

  export async function getBlob() {
    const blob = await dataTypeImpl!.getBlob()
    return blob
  }

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

  export function getColumns() {
    return internalColumns
  }

  export async function getFullRow(originalIndex: number): Promise<Record<string, any>> {
    const fullRow = await dataTypeImpl?.getFullRow(originalIndex)
    if (fullRow) return fullRow
    else throw new Error('Getting the full row did not work. Are you using a supported data method?')
  }

  export async function insertColumns(cols: IColumnMetaData[]) {
    const updatedColumns = await dataTypeImpl!.insertColumns(cols)
    if (updatedColumns) internalColumns = updatedColumns
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
    return await dataTypeImpl!.executeQueryAndReturnResults(query)
  }

  export async function executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any> {
    return await dataTypeImpl!.executeExpressionsAndReturnResults(expressions)
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

  export async function replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string) {
    await dataTypeImpl!.replaceValuesOfColumn(currentValue, updatedValue, column)
  }

  export async function renameColumns(columns: Record<string, string>) {
    await dataTypeImpl!.renameColumns(columns)
    await render()
  }

  function onStoreOptions() {
    if (dev) console.log('onStoreOptions: Storing options ', internalOptions.saveImpl)
    if (browser && internalOptions.saveImpl) {
      internalOptions.saveImpl.store(internalOptions, internalColumns!)
    }
  }

  function toggleFilterVisibility() {
    filterVisibility = !filterVisibility
    columns?.forEach(col => {
      col.filterable = filterVisibility
    })
  }

  async function loadStoredOptions() {
    let cols: IColumnMetaData[] | undefined
    if (internalOptions) {
      if (browser && internalOptions.saveImpl) {
        const id = options ? options.id : internalOptions.id
        if (id) {
          if (dev) console.log(`loadStoredOptions: Loading options & columns for ${id}`)
          const { tableOptions, columnMetaData } = await internalOptions.saveImpl.load(id, internalColumns)
          if (columnMetaData) cols = columnMetaData
          else cols = columns
          if (tableOptions) Object.assign(internalOptions, tableOptions)
          else if (options) Object.assign(internalOptions, options)
        }
      } else Object.assign(internalOptions, options)
    } else Object.assign(internalOptions, options)
    return {
      internalOptions,
      internalColumns: cols,
    }
  }

  function closeModal() {
    if (settingsDialog.attributes.getNamedItem('open') != null) settingsDialog.close()
  }

  onDestroy(() => {
    if (dataTypeImpl) dataTypeImpl.destroy()
  })

  if (browser) {
    window.addEventListener(
      'beforeunload',
      e => {
        if (dev) console.log(`onStoreOptions: Storing options for ${internalOptions.id} before unloading`)
        if (browser && data && internalOptions.saveImpl)
          internalOptions.saveImpl.store(internalOptions, internalColumns!)
      },
      true
    )
  }
  if (browser && document) {
    document.addEventListener(
      'visibilitychange',
      e => {
        if (dev) console.log(`onStoreOptions: Storing options for ${internalOptions.saveImpl} when visiblity changes`)
        if (browser && data && internalOptions.saveImpl)
          internalOptions.saveImpl.store(internalOptions, internalColumns!)
      },
      true
    )
  }
</script>

<dialog data-name="settings-dialog" bind:this={settingsDialog}>
  <div data-name="dialog-container" use:clickOutside on:outClick={closeModal}>
    <button data-name="close-button" on:click={() => settingsDialog.close()}
      ><SvgIcon href={iconsSvgUrl} id="x" width="16px" height="16px" /></button
    >
    <div data-name="modal-dialog">
      <h1>Change column visibility:</h1>
      <div data-name="modal-body">
        {#if internalColumns}
          {#each internalColumns.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as column}
            <div>
              <input
                type="checkbox"
                name={column.id}
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
  </div>
</dialog>

<div data-component="svelte-datatable">
  <div
    data-component="datatable-content"
    data-status={renderStatus ?? ''}
    use:storeOptions
    on:storeoptions={onStoreOptions}
  >
    <table>
      {#if visibleOrderedColumns}
        <colgroup>
          {#if internalOptions.actionColumn}
            <col data-name="col-action" width="0*" />
          {/if}
          {#each visibleOrderedColumns as column, i (column.id)}
            <col width={column.width ? column.width : '0*'} />
          {/each}
        </colgroup>
        <thead>
          {#if internalOptions.paginationOnTop}
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
          <tr data-name="titles">
            {#if internalOptions.actionColumn}
              <th data-name="action-Column">
                {#if internalOptions.singleSort}
                  <button on:click={toggleFilterVisibility}
                    ><SvgIcon href={iconsSvgUrl} id="filter" width="16px" height="16px" /></button
                  >
                {/if}
              </th>
            {/if}
            {#each visibleOrderedColumns as column, i (column.id)}
              <th
                data-direction={column?.sortDirection}
                data-resizable={column?.resizable}
                data-key={column?.id}
                data-sortable={column?.sortable}
                animate:flip={{ duration: 500 }}
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
            {#if internalOptions?.globalFilter}
              {#if filterVisibility == true}
                <th colspan={visibleOrderedColumns.length}>
                  <ColumnFilter
                    column={internalOptions.globalFilter.column ?? 'all'}
                    inputType="text"
                    filter={internalOptions.globalFilter.filter}
                    {disabled}
                    on:columnFilterChanged={onColumnFilterChanged}
                  />
                </th>
              {/if}
            {:else}
              {#each visibleOrderedColumns as column, i (column.id)}
                <th
                  data-resizable={column?.resizable}
                  data-key={column?.id}
                  data-filterable={column?.filterable}
                  animate:flip={{ duration: 500 }}
                >
                  {#if filterVisibility == true && column.filterable !== false}
                    <ColumnFilter
                      column={column.id}
                      inputType="text"
                      filter={column.filter}
                      {disabled}
                      on:columnFilterChanged={onColumnFilterChanged}
                    />
                  {/if}
                </th>
              {/each}
            {/if}
          </tr>
        </thead>
        <tfoot>
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
        </tfoot>
      {/if}
      <tbody>
        {#if renderedData}
          {#each renderedData as row, i (i)}
            <tr data-index={i}>
              {#if $$slots.default}
                <slot
                  renderedRow={row}
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
            <tr data-name="loading" style="height: calc(var(--line-height) * {internalOptions.rowsPerPage})">
              <td colspan={(visibleOrderedColumns?.length ?? 1) + (internalOptions.actionColumn ? 1 : 0)}>
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
