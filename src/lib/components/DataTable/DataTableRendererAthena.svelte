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
    ownEditorVisuals: any = null,
    ownEditorMethods: any = null,
    updateData: Function | null = null,
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
        Second: Update pagination
        Finally: Resolve the data and scheme
    */
      await setColumnFilters($filter)
        .then(() => {
          setTablePagination({
            currentPage: $pagination.currentPage,
            totalPages: Math.ceil($dataStore.length / $pagination.rowsPerPage),
            rowsPerPage: $pagination.rowsPerPage,
            totalRows: $data.length,
          })
        })
        .finally(() => {
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

  // Custom method to update the data
  if (updateData == null) {
    updateData = async (index: string, value: string) => {
      const indexes = index.split('-')
      const row = Number(indexes[0])
      const col = Number(indexes[1])
      // TODO: resolve issue of edit not working correctly when data is sorted
      data.update(data => {
        data[row][col][1] = value
        return data
      })
    }
  }

  $: {
    $data
    dataChanged.set(true)
  }
</script>

<!-- <div data-component="download-container">
    {#if $originalData != undefined || $originalData != null}
      <FileDownload data={$originalData} />
    {/if}
  </div> -->

<DataTableRendererSpecial
  {hasData}
  {rowEvent}
  bind:filter
  bind:sorting
  bind:pagination
  bind:parentChange={dataChanged}
  {updateData}
  {ownEditorVisuals}
  {ownEditorMethods}
/>
