<script lang="ts">
  import { browser, dev } from '$app/environment'
  import DataTable from '$lib/components/DataTable.svelte'
  import EditableCell from '$lib/components/EditableCell.svelte'
  import { athenaClass } from '$lib/components/datatable/customData/athenaClass'
  import { flip } from 'svelte/animate'
    import { AthenaClass } from './AthenaClass'

  let dataTableCustomAthena: DataTable

  async function fetchDataAthena() {
    const url = 'https://athena.ohdsi.org/api/v1/concepts?pageSize=15&domain=Drug'
    const response = await fetch(url)
    const apiData = await response.json()
    return {
      data: apiData.content,
      totalRows: apiData.totalElements,
    }
  }

  const athenaColumns = [
    {
      id: 'id',
      filterable: false,
    },
    {
      id: 'code',
      filterable: false,
    },
    {
      id: 'name',
    },
    {
      id: 'className',
      filterable: false,
    },
    {
      id: 'standardConcept',
      filterable: false,
      visible: false,
    },
    {
      id: 'invalidReason',
      filterable: false,
      visible: false,
    },
    {
      id: 'domain',
      filterable: false,
    },
    {
      id: 'vocabulary',
      filterable: false,
    },
    {
      id: 'score',
      filterable: false,
      visible: false,
    },
  ]

  const classAthena = new athenaClass()
</script>

<p>Click the delete button and check the logs in the console, it should say it is a custom error</p>
<DataTable
  data={fetchDataAthena}
  columns={athenaColumns}
  bind:this={dataTableCustomAthena}
  options={{
    id: 'athena',
    rowsPerPage: 7,
    rowsPerPageOptions: [7, 15],
    actionColumn: true,
    singleSort: false,
    dataTypeImpl: new AthenaClass(),
  }}
  let:originalIndex
  let:renderedRow
  let:columns
>
  <td>
    <button on:click={async () => await dataTableCustomAthena.deleteRows([originalIndex])}>Delete row</button>
  </td>
  {#each columns || [] as column, i (column.id)}
    <td animate:flip={{ duration: 500 }}>
      <EditableCell
        value={renderedRow[column.id]}
        on:valueChanged={async event =>
          await dataTableCustomAthena.updateRows(
            new Map([[originalIndex, Object.fromEntries([[column.id, event.detail]])]])
          )}
      />
    </td>
  {/each}
</DataTable>
