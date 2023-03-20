<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IMapping from '$lib/interfaces/IMapping'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import { onMount } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
  import ShowColumns from '../Extra/ShowColumns.svelte'
  import FileDownload from '../FileDownload/FileDownload.svelte'

  export let columns: Writable<Array<IScheme>> = writable<Array<IScheme>>([]),
    data: Writable<any> = writable<any>(),
    dataType: string,
    delimiter: string = ',',
    downloadable: boolean = false,
    url: string | undefined = undefined,
    fetchOptions: object | undefined = undefined,
    file: File | undefined = undefined,
    fileName: string | undefined = undefined,
    rowEvent: Function | undefined = undefined,
    ownEditorVisuals: any = undefined,
    ownEditorMethods: any = undefined,
    updateData: Function | undefined = undefined,
    mapping: any | undefined = undefined,
    map: boolean = false,
    selectedRow: Writable<string> = writable(''),
    autoMapping: boolean = true,
    mappingURL: string = 'https://athena.ohdsi.org/api/v1/concepts?query=INSERT_QUERY',
    mappingFetchOptions: object = {},
    mappingFileType: string = 'json',
    mappingDelimiter: string = ','

  let worker: Worker | undefined = undefined

  let filters = writable<Array<IFilter>>([])
  let sorting = writable<Array<ISort>>([])
  let pagination = writable<IPaginated>({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 10,
    totalRows: 10,
  })
  let parentChange = writable<boolean>(false)

  const workerMess = writable<boolean>(false)

  /*
    This is the Arquero component where we fetch all of the data (CSV or JSON) and manipulate it with Arquero.
    With this version we need a webworker because we don't want to do the heavy lifting on our GUI thread (sorting, filtering, pagination).
    The user needs to give some params to this component like URL to know where to fetch the data, fetchOptions to know how to fetch.
    The last param is optional but recommended and this is a function the user creates to manipulate the data to the given format.
  */

  const getData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      workerMess.set(false)
      resolve({
        scheme: $columns,
        data: $data,
      })
    })
  }

  const hasData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      worker?.postMessage({
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
        columns: $columns,
      })
      workerMess.set(false)

      // Wait for the worker to send a message
      let count = 0
      while ($workerMess != true) {
        await new Promise(resolve => setTimeout(resolve, 50))
        count += 1
        if (count > 50) $workerMess = true
      }
      if ($workerMess == true) {
        resolve(await getData())
      }
    })
  }

  // Create a custom updateData method when there was none given
  if (updateData == undefined) {
    updateData = async (index: string, value: string): Promise<void> => {
      worker?.postMessage({
        editData: {
          index: index,
          value: value,
        },
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
        columns: $columns,
      })
    }
  }

  const onWorkerMessage = async (data: any): Promise<void> => {
    // Check what has changed and update the stores if needed
    if (data.data.processedData.columns != $columns) $columns = data.data.processedData.columns
    if (data.data.processedData.data != $data) $data = data.data.processedData.data
    const pag = data.data.processedData.pagination
    if (pag != undefined) {
      if (
        pag.currentPage != $pagination.currentPage ||
        pag.rowsPerPage != $pagination.rowsPerPage ||
        pag.totalPages != $pagination.totalPages ||
        pag.totalRows != $pagination.totalRows
      ) {
        $pagination = data.data.processedData.pagination
      }
    }
    workerMess.set(true)
    if (rowEvent != undefined) {
      rowEvent(null, false)
      if (data.data.processedData.update == true) {
        parentChange.set(true)
        setTimeout(function () {
          // Add a class to the row that has been updated
          document.getElementById(mapping.row)?.classList.add('mapped')
        }, 0)
      }
    }
  }

  const loadWorker = async (): Promise<void> => {
    const w = await import('../../workers/csr.worker?worker')
    worker = new w.default()
    const mapper: IMapping = {
      mappingURL: mappingURL,
      mappingFetchOptions: mappingFetchOptions,
      mappingFileType: mappingFileType,
      mappingDelimiter: mappingDelimiter,
    }
    // Check how the file has been given to the application (REST, Drag & Drop or local in the data folder)
    if (url != undefined) {
      worker.postMessage({
        filePath: url,
        method: 'REST',
        fileType: dataType,
        delimiter: delimiter,
        fetchOptions: fetchOptions,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
        columns: $columns,
        autoMapping: autoMapping,
        mapper: mapper,
      })
    } else if (file != undefined) {
      worker.postMessage({
        file: file,
        method: 'file',
        fileType: dataType,
        delimiter: delimiter,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
        columns: $columns,
        autoMapping: autoMapping,
        mapper: mapper,
      })
    } else if (fileName != undefined) {
      worker.postMessage({
        filePath: `../data/${fileName}`,
        method: 'local',
        fileType: dataType,
        delimiter: delimiter,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
        columns: $columns,
        autoMapping: autoMapping,
        mapper: mapper,
      })
    }
    worker.onmessage = onWorkerMessage
  }

  const terminateWorker = async (): Promise<void> => {
    if (worker != undefined) {
      worker?.terminate()
    }
  }

  $: {
    // When a new file has been given
    if (file != undefined) {
      terminateWorker()
      loadWorker()
    }
  }

  $: {
    // When mapping of a row has been done
    if (mapping != undefined && map == true) {
      worker?.postMessage({
        mapping: mapping,
        columns: $columns,
      })
      map = false
    }
  }

  onMount(loadWorker)
</script>

{#if downloadable == true}
  <div data-component="download-container">
    {#if worker != undefined}
      <FileDownload bind:worker />
    {/if}
  </div>
{/if}

<ShowColumns bind:columns bind:parentChange />

<DataTableRendererBasic
  {hasData}
  {rowEvent}
  bind:filters
  bind:sorting
  bind:pagination
  bind:parentChange
  bind:selectedRow
  {updateData}
  {ownEditorVisuals}
  {ownEditorMethods}
/>
