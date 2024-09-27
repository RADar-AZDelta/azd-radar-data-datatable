<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { storeOptions } from '../actions/storeOptions'
  import type Query from 'arquero/dist/types/query/query'
  import type { IColumnMetaData, IDataTableProps, IRowNavigation } from '../interfaces/Types'
  import DataTable from '../helpers/datatable/DataTable.svelte'
  import ColGroup from './datatable/ColGroup.svelte'
  import TableHead from './datatable/elements/TableHead.svelte'
  import { getDataTable } from '../stores/store.svelte'
  import TableFoot from './datatable/elements/TableFoot.svelte'
  import TableBody from './datatable/elements/TableBody.svelte'
  import columnsClass from '../helpers/columns/Columns.svelte'
  import optionsClass from '../helpers/Options.svelte'

  let {
    data,
    columns,
    options = $bindable(undefined),
    disabled,
    modifyColumnMetadata,
    initialized,
    rendering,
    rendered,
    paginationChanged,
    rowChild,
    actionHeaderChild,
    actionCellChild,
    loadingChild,
    noDataChild,
    addRowChild,
  }: IDataTableProps = $props()

  async function setup() {
    const dt = new DataTable()
    getDataTable().setDataTable(dt)
    getDataTable().dataTable?.updateVariables({ rendered, rendering, initialized, modifyColumnMetadata, options, columns, data, disabled })
    await getDataTable().dataTable?.init()
  }

  export const render = async (onlyPaginationChanged = false) => await getDataTable().dataTable?.render(onlyPaginationChanged)
  export const saveToFile = async () => await getDataTable().dataTable?.saveToFile()
  export const getBlob = async (): Promise<Blob | undefined> => await getDataTable().dataTable?.getBlob()
  export const getData = async () => getDataTable().dataTable?.data
  export const updateRows = async (rows: Map<number, Record<string, any>>) => await getDataTable().dataTable?.updateRows(rows)
  export const insertRows = async (rows: Record<string, any>[]) => await getDataTable().dataTable?.insertRows(rows)
  export const deleteRows = async (originalIndices: number[]) => await getDataTable().dataTable?.deleteRows(originalIndices)
  export const getColumns = () => getDataTable().dataTable?.getColumns()
  export const getFullRow = async (originalIndex: number) => await getDataTable().dataTable?.getFullRow(originalIndex)
  export const getNextRow = async (currentIndex: number): Promise<IRowNavigation> => await getDataTable().dataTable?.getNextRow(currentIndex)
  export const getPreviousRow = async (currentIndex: number): Promise<Record<string, any>> => await getDataTable().dataTable?.getPreviousRow(currentIndex)
  export const insertColumns = async (cols: IColumnMetaData[]) => await getDataTable().dataTable?.insertColumns(cols)
  export const updateColumns = async (cols: IColumnMetaData[]) => await getDataTable().dataTable?.updateColumns(cols)
  export const executeQueryAndReturnResults = async (query: Query | object) => await getDataTable().dataTable?.executeQueryAndReturnResults(query)
  export const executeExpressionsAndReturnResults = async (exp: Record<string, any>) => await getDataTable().dataTable?.executeExpressionsAndReturnResults(exp)
  export const getTablePagination = () => getDataTable().dataTable?.getTablePagination()
  export const changePagination = async (pag: { currentPage?: number; rowsPerPage?: number }) => await getDataTable().dataTable?.changePagination(pag)
  export const setDisabled = (value: boolean) => getDataTable().dataTable?.setDisabled(value)
  export const replaceValuesOfColumn = async (curr: any, updated: any, col: string) => await getDataTable().dataTable?.replaceValuesOfColumn(curr, updated, col)
  export const renameColumns = async (columns: Record<string, string>) => await getDataTable().dataTable?.renameColumns(columns)
  export const triggerOptionsAndColumnsSave = async () => {
    console.log("TRYING TO SAVE")
    await getDataTable().dataTable?.triggerOptionsAndColumnsSave()
  }

  onMount(async () => await setup())

  onDestroy(() => {
    getDataTable().dataTable?.destroy()
  })
</script>

{#if optionsClass.internalOptions}
  {@const renderStatus = getDataTable().dataTable?.renderStatus}
  <div data-component="svelte-datatable">
    <div data-component="datatable-content" data-status={renderStatus ?? ''} use:storeOptions onstoreoptions={triggerOptionsAndColumnsSave}>
      <table>
        {#if columnsClass.visibleOrderedColumns}
          <ColGroup />
          <TableHead {paginationChanged} {actionHeaderChild} />
          <TableFoot {paginationChanged} />
        {/if}
        <TableBody {actionCellChild} {addRowChild} {loadingChild} {noDataChild} {rowChild} />
      </table>
    </div>
  </div>
{/if}
