<script lang="ts">
  import { tick } from 'svelte'
  import { op, query } from 'arquero'
  import { flip } from 'svelte/animate'
  import data from './testData.json'
  import DataTable from '@dtlib/components/DataTable.svelte'
  import EditableCell from '@dtlib/components/datatable/extra/EditableCell.svelte'
  import type { ITableOptions } from '@dtlib'
  import type Query from 'arquero/dist/types/query/query'
  import type { TableExpr } from 'arquero/dist/types/table/transformable'
  import type { ModifyColumnMetadataFunc } from '@dtlib/interfaces/Types'

  let file = $state<File>(setFile())
  let datatable = $state<DataTable>()
  let options: ITableOptions = {
    id: 'testingDatatable',
    rowsPerPage: 7,
    rowsPerPageOptions: [7, 15],
    actionColumn: true,
    singleSort: false,
    paginationOnTop: false,
  }

  const modifyColumnMetadata: ModifyColumnMetadataFunc = columns => {
    columns.map((col, index) => {
      col.editable = index % 2 === 0
      return col
    })
    return columns
  }

  ////////////////////////////////////////// Helper methods //////////////////////////////////////////

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = name
    document.body.appendChild(downloadLink)
    downloadLink.click()
  }

  function downloadTestFile() {
    const blob = jsonToCsv(data)
    download(blob, 'datatable-test.csv')
  }

  function jsonToCsv(json: Record<string, string | number | boolean>[]) {
    const firstObject = json[0] ?? json.filter(j => j)[0]
    const fields = Object.keys(firstObject)
    const replacer = function (key: string, value: string | number) {
      return value === null ? '' : value
    }
    const csvFields = json.map(row => fields.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    csvFields.unshift(fields.join(',')) // add header column
    const csv = csvFields.join('\r\n').replaceAll('"', '')
    const blob = new Blob([csv], { type: 'text/csv' })
    return blob
  }

  async function onFileInputChange(e: Event) {
    await setFileOnInputChange(e)
    await tick()
    if (!datatable) return
    await datatable.render()
  }

  async function setFileOnInputChange(e: Event) {
    const inputFiles = (e.target as HTMLInputElement).files
    if (!inputFiles) return

    for (const f of inputFiles) {
      const extension = f.name.split('.').pop()
      if (!extension) continue
      file = f
      break
    }
  }

  function setFile() {
    const blob = jsonToCsv(data)
    return new File([blob], 'file.csv', { type: 'text/csv' })
  }

  ////////////////////////////////////////// Testing method //////////////////////////////////////////

  async function deleteRow() {
    if (!datatable) return
    await datatable.deleteRows([1])
  }

  async function saveToFile() {
    if (!datatable) return
    await datatable.saveToFile()
  }

  async function getBlob() {
    if (!datatable) return
    const blob = await datatable.getBlob()
    if (!blob) return
    download(blob, 'getBlob.csv')
  }

  async function getData() {
    if (!datatable) return
    const data = await datatable.getData()
    console.info(`Data from getData method:\n`, data)
    download(data as Blob, 'getData.csv')
  }

  async function updateRows() {
    if (!datatable) return
    await datatable.updateRows(new Map([[1, { sourceName: 'test update' }]]))
  }

  async function insertRows() {
    if (!datatable) return
    const columns = await getColumns()
    if (!columns) return
    const testData: Record<string, string> = {}
    for (const column of columns) testData[column.id] = 'test'
    await datatable.insertRows([testData])
  }

  async function deleteRows() {
    if (!datatable) return
    await datatable.deleteRows([2])
  }

  async function getColumns() {
    if (!datatable) return
    const columns = datatable.getColumns()
    console.info(`Columns from getColumns method:\n`, columns)
    return columns
  }

  async function getFullRow() {
    if (!datatable) return
    const row = await datatable.getFullRow(1)
    console.info(`Row with index 1 from getFullRow method:\n`, row)
  }

  async function getNextRow() {
    if (!datatable) return
    const row = await datatable.getNextRow(1)
    console.info(`Next row from index 1 from getNextRow method:\n`, row)
  }

  async function getPreviousRow() {
    if (!datatable) return
    const row = await datatable.getPreviousRow(1)
    console.info(`Next row from index 0 from getNextRow method:\n`, row)
  }

  async function insertColumns() {
    if (!datatable) return
    await datatable.insertColumns([{ id: 'testColumn', label: 'Test Label' }])
  }

  async function updateColumns() {
    if (!datatable) return
    let columns = await getColumns()
    if (!columns) return
    columns[0].label = 'Updated label'
    await datatable.updateColumns(columns)
  }

  async function executeQueryAndReturnResults() {
    if (!datatable) return
    const params: Record<string, string> = { type: 'FLAGGED' }
    const expr: TableExpr = (r: any, p: any) => {
      return op.equal(r.mappingStatus, p.type)
    }
    const q = (query().params(params) as Query).filter(expr).toObject()
    const queryResult = await datatable.executeQueryAndReturnResults(q)
    console.info(`Query result for rows with mappingStatus = MAPPED from executeQueryAndReturnResults method:\n`, queryResult)
  }

  async function getTablePagination() {
    if (!datatable) return
    const pagination = datatable.getTablePagination()
    console.info(`Pagination of data from getTablePagination:\n`, pagination)
    return pagination
  }

  async function changePagination() {
    if (!datatable) return
    const pagination = await getTablePagination()
    if (!pagination) return
    const { currentPage } = pagination
    await datatable.changePagination({ currentPage: currentPage && currentPage > 1 ? 1 : 2, rowsPerPage: 3 })
  }

  let disabled: boolean = false
  async function setDisabled() {
    if (!datatable) return
    disabled = !disabled
    datatable.setDisabled(disabled)
  }

  async function replaceValuesOfColumn() {
    if (!datatable) return
    await datatable.replaceValuesOfColumn('SEMI-APPROVED', 'TEST', 'mappingStatus')
    console.info(`Set all the APPROVED mappingStatus to TEST from replaceValuesOfColumn method`)
  }

  async function renameColumns() {
    if (!datatable) return
    await datatable.renameColumns({ sourceName: 'renamedSourceName' })
    const columns = await getColumns()
    if (!columns) return
    console.info(`Renamed sourceName column to renamedSourceName via renameColumns method:\n`, columns)
  }

  async function triggerOptionsAndColumnsSave() {
    if (!datatable) return
    await datatable.triggerOptionsAndColumnsSave()
  }

  async function changeValue(value: string, columnId: string, originalIndex: number) {
    if (!datatable) return
    await datatable.updateRows(new Map([[originalIndex, Object.fromEntries([[columnId, value]])]]))
  }

  async function deleteRowViaAction(indexes: number[] = [1]) {
    if (!datatable) return
    await datatable.deleteRows(indexes)
  }
</script>

{#if file}
  <DataTable data={file} {options} {modifyColumnMetadata} bind:this={datatable}>
    {#snippet rowChild({ renderedRow, originalIndex, columns })}
      <td>
        <button onclick={() => deleteRowViaAction([originalIndex])}>Delete row</button>
      </td>
      {#each columns || [] as column (column.id)}
        <td animate:flip={{ duration: 500 }}>
          {#if column.editable === false}
            <p>{renderedRow[column.id]}</p>
          {:else}
            <EditableCell value={renderedRow[column.id]} changeValue={async value => await changeValue(value, column.id, originalIndex)} />
          {/if}
        </td>
      {/each}
    {/snippet}
  </DataTable>
{/if}

<label for="fileInput">Upload a file</label>
<input id="fileInput" type="file" accept=".csv" onchange={onFileInputChange} />
<button onclick={downloadTestFile}>Download testing file</button>

<div class="container">
  <button onclick={deleteRow}>delete row</button>
  <button onclick={saveToFile}>save to file</button>
  <button onclick={getBlob}>get blob</button>
  <button onclick={getData}>get data</button>
  <button onclick={updateRows}>update rows</button>
  <button onclick={insertRows}>insert rows</button>
  <button onclick={deleteRows}>delete rows</button>
  <button onclick={getColumns}>get columns</button>
  <button onclick={getFullRow}>get full row</button>
  <button onclick={getNextRow}>get next row</button>
  <button onclick={getPreviousRow}>get previous row</button>
  <button onclick={insertColumns}>insert columns</button>
  <button onclick={updateColumns}>update columns</button>
  <button onclick={executeQueryAndReturnResults}>execute query and return results</button>
  <button onclick={getTablePagination}>get table pagination</button>
  <button onclick={changePagination}>change pagination</button>
  <button onclick={setDisabled}>set disabled/enabled</button>
  <button onclick={replaceValuesOfColumn}>replace values of column</button>
  <button onclick={renameColumns}>rename columns</button>
  <button onclick={triggerOptionsAndColumnsSave}>trigger options and columns save</button>
</div>

<style>
  .container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
</style>
