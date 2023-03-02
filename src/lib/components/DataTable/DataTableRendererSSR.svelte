<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import { writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'

  export let url: string,
    fetchOptions: object,
    transpileData: Function | undefined = undefined,
    pagination: IPaginated,
    filters: IFilter[],
    sorting: ISort[]

  const paginationStore = writable<IPaginated>(pagination)
  const filtersStore = writable<IFilter[]>(filters)
  const sortingStore = writable<ISort[]>(sorting)

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
      resolve(data)
    })
  }
</script>

<DataTableRendererBasic {hasData} pagination={paginationStore} filters={filtersStore} sorting={sortingStore} />
