<script lang="ts">
  import type ISort from '$lib/interfaces/ISort'
  import { writable, type Writable } from 'svelte/store'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ITableData from '$lib/interfaces/ITableData'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import FileDownload from '../FileDownload/FileDownload.svelte'
  import DataTableRendererSpecial from '../DataTableBasics/DataTableRendererSpecial.svelte'

  export let data: Writable<[string, any][][]>,
    columns: IScheme[],
    rowEvent: Function | null = null,
    pagination: Writable<IPaginated>,
    filter: Writable<string>,
    sorting: Writable<ISort>

  const columnsStore = writable<IScheme[]>(columns)
  const dataStore = writable<[string, any][][]>()
  let dataChanged = writable<boolean>(false)

  const setColumnFilters = async (filter?: string) => {
    let filteredData: [string, any][][] = []
    /*
        Filter column name out of data
    */
    for (let person of $data) {
      let personInfo: [string, any][] = []
      for (let information of person) {
        personInfo.push(information[1])
      }
      filteredData.push(personInfo)
    }

    /*
        The filter set will be given to the Athena API
    */
    $dataStore = filteredData
  }

  const setTablePagination = async (tablePagination: IPaginated) => {
    /*
        Update pagination store
    */
    pagination.set({
      currentPage: tablePagination.currentPage,
      totalPages: Math.ceil($dataStore.length / tablePagination.rowsPerPage),
      rowsPerPage: tablePagination.rowsPerPage,
      totalRows: $data.length,
    })
  }

  const getData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      /*
        First: Get column scheme
        Finally: Resolve the data and scheme
      */
      await setColumnFilters($filter).finally(() => {
        resolve({ data: $dataStore, scheme: $columnsStore })
      })
    })
  }

  const hasData = async () => {
    return new Promise(async (resolve, reject) => {
      resolve(await getData())
    })
  }

  // TODO: make it possible to update data with ex. only numbers

  $: {
    $data
    dataChanged.set(true)
  }
</script>

<DataTableRendererSpecial
  {hasData}
  {rowEvent}
  bind:filter
  bind:sorting
  bind:pagination
  pagesShown={7}
  bind:parentChange={dataChanged}
/>
