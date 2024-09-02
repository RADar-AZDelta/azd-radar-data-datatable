<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { flip } from 'svelte/animate'
  import { sleep } from '../utils'
  import DataTable from '../components/DataTable.svelte'
  import EditableCell from '../components/EditableCell.svelte'
  import { query } from 'arquero'
  import type { IColumnMetaData, IPagination, SortDirection, TFilter } from '../interfaces/Types'
  import { FetchDataTypeClass } from '../examples/FetchDataTypeClass'

  const data: Record<string, any>[] = [
    {
      name: 'Rory',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue des Taillis 221,Gijzelbrechtegem,West Flanders,8570,',
    },
    {
      name: 'Amethyst',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Eikstraat 450,Belgrade,Namur,5001,',
    },
    {
      name: 'Bob',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue du Château 143,Lochristi,East Flanders,9080,',
    },
    {
      name: 'Cindy',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue Libert 93,Warsage,Liège,4608,',
    },
    {
      name: 'Derek',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    },
    {
      name: 'Eve',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue du Pont Simon 204,Antwerpen,Antwerp,2040,',
    },
    {
      name: 'Frank',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue du Vert Galant 190,Poulseur,Liège,4171,',
    },
    {
      name: 'Gina',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Poolse Winglaan 288,Sint-Kwintens-Lennik,Flemish Brabant,1750,',
    },
    {
      name: 'Hannah',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue de la Poste 335,Ramsdonk,Flemish Brabant,1880,',
    },
    {
      name: 'Ivan',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue du Centre 259,Marquain,Hainaut,7522,',
    },
    {
      name: 'Jenny',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue des Campanules 311,Strombeek-Bever,Flemish Brabant,1853,',
    },
    {
      name: 'Karl',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue Engeland 373,Neerrepen,Limburg,3700,',
    },
  ]

  const matrix = data.map(obj => Object.values(obj))

  const columns: IColumnMetaData[] = [
    {
      id: 'name',
      label: 'NAAM',
      // sortDirection: 'asc',
      // sortOrder: 0,
      position: 0,
    },
    {
      id: 'age',
      sortable: false,
      position: 1,
    },
    {
      id: 'country',
      // filter: 'b',
      position: 4,
      repositionable: false,
    },
    {
      id: 'telephone',
      position: 2,
      filterable: false,
    },
    {
      id: 'address',
      position: 3,
      // sortDirection: 'desc',
      // sortOrder: 1,
    },
  ]

  let dataTableMatrix: DataTable, dataTableArrayOfObjects: DataTable, dataTableFetchFunction: DataTable, dataTableFile: DataTable

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // FETCH FUNCTIONS
  ///////////////////////////////////////////////////////////////////////////////////////////////

  async function fetchData(
    filteredColumns: Map<string, TFilter>,
    sortedColumns: Map<string, SortDirection>,
    pagination: IPagination,
  ): Promise<{ totalRows: number; data: any[][] | any[] }> {
    //lets simulate a remote fetch call

    //FILTER
    let fetchedData = data
    for (const [column, filter] of [...filteredColumns].values()) {
      fetchedData = fetchedData.filter(obj => obj[column]?.toString()?.toLowerCase().indexOf(filter) > -1)
    }
    const totalRows = fetchedData.length

    //SORT
    for (let [column, sortDirection] of [...sortedColumns].reverse()) {
      switch (sortDirection) {
        case 'asc':
          fetchedData = fetchedData.sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0))
          break
        case 'desc':
          fetchedData = fetchedData.sort((a, b) => (b[column] < a[column] ? -1 : b[column] > a[column] ? 1 : 0))
          break
      }
    }

    //PAGINATION
    const { currentPage, rowsPerPage } = pagination
    if (!currentPage || !rowsPerPage) fetchedData = fetchedData.slice(0, 20)
    else {
      const start = (currentPage - 1) * rowsPerPage ?? 0
      const end = currentPage * rowsPerPage
      fetchedData = fetchedData.slice(start, end)
    }

    await sleep(500)
    return { totalRows, data: fetchedData }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // BUTTON EVENTS
  ///////////////////////////////////////////////////////////////////////////////////////////////
  let file: File

  function onFileInputChange(e: Event) {
    const allowedExtensions = ['csv', 'json']
    const inputFiles = (e.target as HTMLInputElement).files
    if (!inputFiles) return

    for (const f of inputFiles) {
      const extension = f.name.split('.').pop()
      if (extension && allowedExtensions.includes(extension)) {
        file = f
        break
      }
    }
  }

  async function onClickInsertRows(dataTable: DataTable) {
    const newRow = {
      name: 'Rudy',
      age: 45,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Machelsesteenweg 343,Montroeul-sur-Haine,Hainaut,7350,',
    }
    await dataTable.insertRows([newRow])
  }

  // async function onClickSaveButton(dataTable: DataTable) {
  //   await dataTable.saveToFile()
  // }

  // async function getBlob(dataTable: DataTable) {
  //   const blob = await dataTable.getBlob()
  //   console.log('BLOB ', blob, ' AND CONTENT ', await blob.text())
  // }

  // async function updateRows(dataTable: DataTable) {
  //   await dataTable.updateRows(new Map([[1, { sourceName: 'test update' }]]))
  // }

  // async function deleteRow(dataTable: DataTable) {
  //   await dataTable.deleteRows([1])
  // }

  // async function getNextRow(dataTable: DataTable) {
  //   console.log(await dataTable.getNextRow(1))
  // }

  // async function getPrevRow(dataTable: DataTable) {
  //   console.log(await dataTable.getPreviousRow(1))
  // }

  // async function onClickInsertRowsCSV(dataTable: DataTable) {
  //   const rows: Record<string, any> = {}
  //   const dummyRow = dataTable
  //     .getColumns()
  //     ?.map(col => col.id)
  //     .reduce((acc, cur) => {
  //       acc[cur] = ' insert'
  //       return acc
  //     }, rows)
  //   await dataTable.insertRows([dummyRow])
  // }

  // async function getRow(dataTable: DataTable) {
  //   const row = await dataTable.getFullRow(1)
  //   console.log(row)
  // }

  // async function insertColumn(dataTable: DataTable) {
  //   await dataTable.insertColumns([{ id: 'test', label: 'inserted Col' }])
  // }

  // async function executeQuery(dataTable: DataTable) {
  //   const q = query()
  //     .params({ sourceName: 'Roken' })
  //     .filter((r: any, p: any) => r.sourceName === p.sourceName)
  //     .toObject()
  //   const res = await dataTable.executeQueryAndReturnResults(q)
  //   console.log('RES ', res)
  // }

  // async function replaceValuesOfColumn(dataTable: DataTable) {
  //   await dataTable.replaceValuesOfColumn(0, 20, 'sourceFrequency')
  // }
</script>

<svelte:head>
  <title>Radar DataTable</title>
  <meta
    name="description"
    content="The Svelte Radar DataTable is a datatable component that can handle CSV's with more than 100.000 rows. It does not only work with CSV's but also with a fetch function, matrix of data or a list of objects."
  />
</svelte:head>

<article>
  <header>
    <h1>@radar-azdelta/svelte-datatable demo</h1>
    <p>
      Why yet another datatable component? During the development of <a href="https://github.com/RADar-AZDelta/Keun">Keun</a>, we needed a datatable component
      that could handle CSV's with more than 100.000 rows. We didn't find anything that suited our needs, so we developed our own.
    </p>
  </header>

  <details open>
    <summary>Table with a matrix of values as a data source (columns property needs to be supplied)</summary>
    <DataTable
      {columns}
      data={matrix}
      bind:this={dataTableMatrix}
      options={{
        id: 'matrix',
        rowsPerPage: 7,
        rowsPerPageOptions: [7, 15],
        actionColumn: true,
        singleSort: false,
        paginationOnTop: false,
      }}
    >
      {#snippet rowChild(renderedRow, originalIndex, index, columns, options)}
        <td>
          <button on:click={async () => await dataTableMatrix.deleteRows([originalIndex])}>Delete row</button>
        </td>
        {#each columns || [] as column, i (column.id)}
          <td animate:flip={{ duration: 500 }}>
            <EditableCell
              value={renderedRow[column.id]}
              changeValue={async (value: any) => await dataTableMatrix.updateRows(new Map([[originalIndex, Object.fromEntries([[column.id, value]])]]))}
            />
          </td>
        {/each}
      {/snippet}
    </DataTable>

    <br />
    <button on:click={() => onClickInsertRows(dataTableMatrix)}>Insert row (remove country filter to view updated records)</button>
  </details>

  <hr />

  <details>
    <summary>Table with an array of objects as a data source</summary>
    <DataTable {data} bind:this={dataTableArrayOfObjects} options={{ id: 'array' }}>
      {#snippet actionCellChild(renderedRow, originalIndex, index, columns, options)}
        <td>
          <button on:click={async () => await dataTableArrayOfObjects.deleteRows([originalIndex])}>Delete row</button>
        </td>
      {/snippet}
    </DataTable>

    <br />
    <button on:click={() => onClickInsertRows(dataTableArrayOfObjects)}>Insert row</button>
  </details>

  <hr />

  <details>
    <summary>Table with a async function as a data source (ex: fetch data from web server)</summary>
    <DataTable {columns} data={fetchData} bind:this={dataTableFetchFunction} options={{ id: 'function', dataTypeImpl: new FetchDataTypeClass() }} />
  </details>

  <hr />

  <details open>
    <summary
      >Table with a CSV file as a data source (ex: <a
        href="https://raw.githubusercontent.com/RADar-AZDelta/AZDelta-OMOP-CDM/main/drug_exposure/drug_concept_id/medicatie_usagi.csv">medicatie_usagi.csv</a
      >)</summary
    >
    <label for="fileInput">Upload a file</label>
    <input id="fileInput" type="file" accept=".csv" on:change={onFileInputChange} />
    <DataTable
      data={file}
      bind:this={dataTableFile}
      options={{
        id: 'fileUsagi',
        actionColumn: true,
        saveOptions: false,
        rowsPerPage: 5,
      }}
      modifyColumnMetadata={columns =>
        columns.map((col, index) => {
          col.editable = index % 2 === 0
          return col
        })}
    >
      {#snippet rowChild(renderedRow, originalIndex, index, columns, options)}
        <td>
          <button on:click={async () => await dataTableFile.deleteRows([originalIndex])}>Delete row</button>
        </td>
        {#each columns || [] as column, i (column.id)}
          <td animate:flip={{ duration: 500 }}>
            {#if column.editable === false}
              <p>{renderedRow[column.id]}</p>
            {:else}
              <EditableCell
                value={renderedRow[column.id]}
                changeValue={async value => await dataTableFile.updateRows(new Map([[originalIndex, Object.fromEntries([[column.id, value]])]]))}
              />
            {/if}
          </td>
        {/each}
      {/snippet}
    </DataTable>

    <!-- <br />
    <div class="container">
      <button disabled={!file} on:click={() => onClickSaveButton(dataTableFile)}>save to file</button>
      <button disabled={!file} on:click={() => getBlob(dataTableFile)}>get blob</button>
      <button disabled={!file} on:click={() => updateRows(dataTableFile)}>update rows</button>
      <button disabled={!file} on:click={() => onClickInsertRowsCSV(dataTableFile)}>insert rows</button>
      <button disabled={!file} on:click={() => deleteRow(dataTableFile)}>delete rows</button>
      <button disabled={!file} on:click={() => getRow(dataTableFile)}>get row</button>
      <button disabled={!file} on:click={() => getNextRow(dataTableFile)}>get next row</button>
      <button disabled={!file} on:click={() => getPrevRow(dataTableFile)}>get previous row</button>
      <button disabled={!file} on:click={() => insertColumn(dataTableFile)}>insert column</button>
      <button disabled={!file} on:click={() => executeQuery(dataTableFile)}>execute query</button>
      <button disabled={!file} on:click={() => replaceValuesOfColumn(dataTableFile)}>replace values of column</button>
    </div> -->
  </details>
</article>

<style>
  .container {
    display: grid;
    grid-template-columns: repeat(6, auto);
  }
</style>
