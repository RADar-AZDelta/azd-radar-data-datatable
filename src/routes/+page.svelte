<script lang="ts">
  import DataTable from '$lib/components/DataTable.svelte'
  import type { IColumnMetaData, IPagination, SortDirection, TFilter } from '$lib/components/types'
  import '$lib/styles/data-table.scss'
  import { sleep } from '$lib/utils'

  const data = [
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
    {
      name: 'Rory2',
      age: 45,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Machelsesteenweg 343,Montroeul-sur-Haine,Hainaut,7350,',
    },
  ]

  const matrix = data.map(obj => Object.values(obj))

  const columns: IColumnMetaData[] = [
    {
      id: 'name',
      label: 'NAAM',
      sortDirection: 'asc',
      sortOrder: 0,
    },
    {
      id: 'age',
      sortable: false,
    },
    {
      id: 'country',
      filter: 'b',
    },
    {
      id: 'telephone',
      position: 5,
      filterable: false,
    },
    {
      id: 'address',
      position: 4,
      sortDirection: 'desc',
      sortOrder: 1,
    },
  ]

  async function fetchData(
    filteredColumns: Map<string, TFilter>,
    sortedColumns: Map<string, SortDirection>,
    pagination: IPagination
  ) {
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
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage
    const end = pagination.currentPage * pagination.rowsPerPage
    fetchedData = fetchedData.slice(start, end)

    await sleep(500)
    return { totalRows, data: fetchedData }
  }

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

  let dataTable: DataTable

  async function onClickSaveButton(e: Event) {
    await dataTable.saveToFile()
  }

  async function onClickUpdateRows(e: Event) {
    const dummyRow = dataTable
      .getColumns()
      ?.map(col => col.id)
      .reduce((acc, cur) => {
        acc[cur] = 'update'
        return acc
      }, {})

    await dataTable.updateRows(
      new Map([
        [0, dummyRow!],
        [1, dummyRow!],
      ])
    )
  }

  async function onClickDeleteRows(e: Event) {
    await dataTable.deleteRows([0, 1])
  }

  async function onClickInsertRows(e: Event) {
    const dummyRow = dataTable
      .getColumns()
      ?.map(col => col.id)
      .reduce((acc, cur) => {
        acc[cur] = ' insert'
        return acc
      }, {})

    await dataTable.insertRows([dummyRow!, dummyRow!])
  }
</script>

<h1>RADar-DataTable Demo</h1>

<details>
  <summary>Table with a matrix of values as a data source (columns property needs to be supplied)</summary>
  <DataTable {columns} data={matrix} />
</details>

<hr />

<details>
  <summary>Table with an array of objects as a data source</summary>
  <DataTable {data} />
</details>

<hr />

<details>
  <summary>Table with a async function as a data source (ex: fetch data from web server)</summary>
  <DataTable {columns} data={fetchData} />
</details>

<hr />

<details open>
  <summary>Table with a File as a data source (ex: CSV, JSON)</summary>
  <input type="file" accept=".csv,.json" on:change={onFileInputChange} />
  <DataTable data={file} bind:this={dataTable} />

  <button disabled={!file} on:click={onClickSaveButton}>Save table</button>
  <br />
  <button disabled={!file} on:click={onClickUpdateRows}>Update first 2 rows</button>
  <br />
  <button disabled={!file} on:click={onClickDeleteRows}>Delete first 2 rows</button>
  <br />
  <button disabled={!file} on:click={onClickInsertRows}>Insert 2 rows</button>
</details>
