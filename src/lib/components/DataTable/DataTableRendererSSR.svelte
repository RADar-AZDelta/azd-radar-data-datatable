<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import { writable, type Writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
  import FileDownload from '../FileDownload/FileDownload.svelte'

  export let url: string,
    fetchOptions: object,
    pagination: IPaginated,
    filters: IFilter[],
    sorting: ISort[],
    transpileData: Function | undefined = undefined,
    rowEvent: Function | undefined = undefined,
    selectedRow: Writable<string> = writable('')

  let paginationStore = writable<IPaginated>(pagination)
  let filtersStore = writable<IFilter[]>(filters)
  let sortingStore = writable<ISort[]>(sorting)
  const originalData = writable<any>()

  /*
        This is the REST component where we fetch only a portion of the data with the params we sent to the API
        With this version we don't need a webworker because we only fetch the data but we don't manipulate anything (no sorting, no filtering, no pagination)
        The user needs to give some params to this component like URL to know where to fetch the data, fetchOptions to know how to fetch
        We also needs params like pagination, filters and sorting to let the user change these and fetch the manipulated data again.
        The last param is optional but recommended and this is a function the user creates to manipulate the data to the given format.
    */

  const fetchData = async () => {
    const response = await fetch(url, fetchOptions)
    const data = await response.json()
    if (transpileData != undefined) {
      // if the scheme is not like the default one, we need to transpile the data to the default one (column store)
      return transpileData(data)
    } else {
      return data
    }
  }

  const hasData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      const data = await fetchData()
      originalData.set(data)
      resolve(data)
    })
  }

  // Not editable because you get the data from REST and you would need to make a POST request (maybe in the future)
</script>

<DataTableRendererBasic
  {hasData}
  bind:pagination={paginationStore}
  bind:filters={filtersStore}
  bind:sorting={sortingStore}
  bind:selectedRow
  {rowEvent}
/>

<FileDownload data={$originalData} />
