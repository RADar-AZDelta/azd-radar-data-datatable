<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import { onMount } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
  import DataTableRendererSpecial from '../DataTableBasics/DataTableRendererSpecial.svelte'
  import FileDownload from '../FileDownload/FileDownload.svelte'

  export let url: Writable<string>,
    fetchOptions: object,
    special: boolean = false,
    dataPath: string[] | undefined = undefined,
    currentPagePath: string[] | undefined = undefined,
    totalPagesPath: string[] | undefined = undefined,
    rowsPerPagePath: string[] | undefined = undefined,
    totalRowsPath: string[] | undefined = undefined,
    pagination: Writable<IPaginated> = writable<IPaginated>(undefined),
    filters: Writable<IFilter[]> = writable<IFilter[]>([]),
    singleFilter: Writable<string> = writable<string>(''),
    sorting: Writable<ISort[]> = writable<ISort[]>([]),
    singleSorting: Writable<ISort> = writable<ISort>(undefined),
    columns: Writable<IScheme[]> = writable<IScheme[]>([]),
    transpileData: Function | undefined = undefined,
    rowEvent: Function | undefined = undefined,
    selectedRow: Writable<string> = writable(''),
    downloadable: boolean = false

  const originalData = writable<any>()
  let dataChanged = writable<boolean>(false)
  const data = writable<[string, any][][]>()

  /*
        This is the REST component where we fetch only a portion of the data with the params we sent to the API
        With this version we don't need a webworker because we only fetch the data but we don't manipulate anything (no sorting, no filtering, no pagination)
        The user needs to give some params to this component like URL to know where to fetch the data, fetchOptions to know how to fetch
        We also needs params like pagination, filters and sorting to let the user change these and fetch the manipulated data again.
        The last param is optional but recommended and this is a function the user creates to manipulate the data to the given format.
  */

  const getPath = async (data: any, path: string[]) => {
    let requestedData = data
    if (path != undefined) {
      for (let p of path) {
        requestedData = requestedData[p]
      }
    }
    return requestedData
  }

  const fetchData = async () => {
    const response = await fetch($url, fetchOptions)
    const data = await response.json()
    let currentPageData, totalPagesData, rowsPerPageData, totalRowsData, content
    currentPagePath == undefined
      ? $pagination.currentPage == 0
        ? 1
        : $pagination.currentPage
      : (currentPageData = await getPath(data, currentPagePath))
    totalPagesPath == undefined ? $pagination.totalPages : (totalPagesData = await getPath(data, totalPagesPath))
    rowsPerPagePath == undefined ? $pagination.rowsPerPage : (rowsPerPageData = await getPath(data, rowsPerPagePath))
    totalRowsPath == undefined ? $pagination.totalRows : (totalRowsData = await getPath(data, totalRowsPath))
    dataPath == undefined ? (content = data) : (content = await getPath(data, dataPath))

    if ($pagination.currentPage == 0) {
      $pagination = {
        currentPage: Number(currentPageData),
        totalPages: Number(totalPagesData),
        rowsPerPage: Number(rowsPerPageData),
        totalRows: Number(totalRowsData),
      }
    }

    if (transpileData != undefined) {
      // if the scheme is not like the default one, we need to transpile the data to the default one (column store)
      const transpiledData = await transpileData(content)
      columns.set(transpiledData.scheme)
      return transpiledData
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

  $: {
    $data
    dataChanged.set(true)
  }

  $: {
    $url
    dataChanged.set(true)
  }

  onMount(() => {
    fetchData()
  })

  // Not editable because you get the data from REST and you would need to make a POST request (maybe in the future)
</script>

{#if downloadable == true}
  <FileDownload data={$originalData} />
{/if}

{#if special == true && $pagination.currentPage != 0}
  <DataTableRendererSpecial
    {hasData}
    {rowEvent}
    bind:filter={singleFilter}
    bind:sorting={singleSorting}
    bind:pagination
    pagesShown={7}
    bind:parentChange={dataChanged}
  />
{:else if special == false}
  <DataTableRendererBasic {hasData} bind:pagination bind:filters bind:sorting bind:selectedRow {rowEvent} />
{/if}
