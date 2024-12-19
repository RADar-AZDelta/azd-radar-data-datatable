<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { storeOptions } from '../actions/storeOptions'
  import ColGroup from './datatable/ColGroup.svelte'
  import DataTable from '../helpers/datatable/DataTable.svelte'
  import TableHead from './datatable/elements/TableHead.svelte'
  import TableFoot from './datatable/elements/TableFoot.svelte'
  import TableBody from './datatable/elements/TableBody.svelte'
  import type { IColumnMetaData, IDataTableProps, IRowNavigation } from '../interfaces/Types'

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

  let dt = $state<DataTable>(new DataTable())

  async function setup() {
    await dt.updateVariables({ rendered, rendering, initialized, modifyColumnMetadata, options, columns, data, disabled })
    await dt.init()
  }

  export const render = async (onlyPaginationChanged = false) => await dt?.render(onlyPaginationChanged)
  export const saveToFile = async () => await dt?.saveToFile()
  export const getBlob = async (): Promise<Blob | undefined> => await dt?.getBlob()
  export const getData = async () => dt?.data
  export const updateRows = async (rows: Map<number, Record<string, any>>) => await dt?.updateRows(rows)
  export const insertRows = async (rows: Record<string, any>[]) => await dt?.insertRows(rows)
  export const deleteRows = async (originalIndices: number[]) => await dt?.deleteRows(originalIndices)
  export const getColumns = () => dt?.getColumns()
  export const getFullRow = async (originalIndex: number) => await dt?.getFullRow(originalIndex)
  export const getNextRow = async (currentIndex: number): Promise<IRowNavigation> => await dt?.getNextRow(currentIndex)
  export const getPreviousRow = async (currentIndex: number): Promise<Record<string, any>> => await dt?.getPreviousRow(currentIndex)
  export const insertColumns = async (cols: IColumnMetaData[]) => await dt?.insertColumns(cols)
  export const updateColumns = async (cols: IColumnMetaData[]) => await dt?.updateColumns(cols)
  export const executeQueryAndReturnResults = async (query: object) => await dt?.executeQueryAndReturnResults(query)
  export const executeExpressionsAndReturnResults = async (exp: Record<string, any>) => await dt?.executeExpressionsAndReturnResults(exp)
  export const getTablePagination = () => dt?.getTablePagination()
  export const changePagination = async (pag: { currentPage?: number; rowsPerPage?: number }) => await dt?.changePagination(pag)
  export const setDisabled = (value: boolean) => dt?.setDisabled(value)
  export const replaceValuesOfColumn = async (curr: any, updated: any, col: string) => await dt?.replaceValuesOfColumn(curr, updated, col)
  export const renameColumns = async (columns: Record<string, string>) => await dt?.renameColumns(columns)
  export const triggerOptionsAndColumnsSave = async () => await dt?.triggerOptionsAndColumnsSave()

  onMount(async () => {
    await setup()
  })

  onDestroy(() => {
    dt?.destroy()
  })
</script>

{#if dt?.internalOptions}
  {@const renderStatus = dt?.renderStatus}
  <div data-component="svelte-datatable">
    <div data-component="datatable-content" data-status={renderStatus ?? ''} use:storeOptions onstoreoptions={triggerOptionsAndColumnsSave}>
      <table>
        {#if dt?.visibleOrderedColumns}
          <ColGroup {dt} />
          <TableHead {paginationChanged} {actionHeaderChild} {dt} />
          <TableFoot {paginationChanged} {dt} />
        {/if}
        <TableBody {actionCellChild} {addRowChild} {loadingChild} {noDataChild} {rowChild} {dt} />
      </table>
    </div>
  </div>
{/if}
