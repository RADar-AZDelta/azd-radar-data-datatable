<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
  import FileDownload from '../FileDownload/FileDownload.svelte'

  export let url: string | null = null,
    fetchOptions: object | null = null,
    dataType: string,
    delimiter: string = ',',
    file: File | null = null,
    fileName: string | null = null,
    rowEvent: Function | null = null,
    editable: boolean = false,
    ownEditorVisuals: any = null,
    ownEditorMethods: any = null,
    updateData: Function | null = null,
    mapping: any | null = null,
    map: boolean = false

  let worker: Worker | undefined = undefined

  const filters = writable<Array<IFilter>>([])
  const sorting = writable<Array<ISort>>([])
  const pagination = writable<IPaginated>({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 10,
    totalRows: 10,
  })

  const columns = writable<Array<IScheme>>([])
  const data = writable<any>([])

  const workerMess = writable<boolean>(false)

  let update = 0

  /*
        This is the Arquero component where we fetch all of the data (CSV or JSON) and manipulate it with Arquero.
        With this version we need a webworker because we don't want to do the heavy lifting on our GUI thread (sorting, filtering, pagination).
        The user needs to give some params to this component like URL to know where to fetch the data, fetchOptions to know how to fetch.
        The last param is optional but recommended and this is a function the user creates to manipulate the data to the given format.
    */

  const updateTable = () => {
    update += 1
  }

  const getData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      $workerMess = false
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
      })

      // Wait for the worker to send a message
      while ($workerMess != true) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      resolve(await getData())
    })
  }

  const onWorkerMessage = async (data: any): Promise<void> => {
    $columns = data.data.processedData.columns
    $data = data.data.processedData.data
    if (data.data.processedData.pagination != null || data.data.processedData.pagination != undefined) {
      $pagination = data.data.processedData.pagination
    }
    $workerMess = true
    if (rowEvent != null) {
      rowEvent(null, false)
      if (data.data.processedData.update == true) {
        updateTable()
        setTimeout(function () {
          document.getElementById(mapping.row)?.classList.add('mapped')
        }, 0)
      }
    }
  }

  const loadWorker = async () => {
    const w = await import('../../workers/csr.worker?worker')
    worker = new w.default()
    if (url != null && url != undefined) {
      worker.postMessage({
        filePath: url,
        method: 'REST',
        fileType: dataType,
        delimiter: delimiter,
        fetchOptions: fetchOptions,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
      })
    } else if (file != null && file != undefined) {
      worker.postMessage({
        file: file,
        method: 'file',
        fileType: dataType,
        delimiter: delimiter,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
      })
    } else if (fileName != null && fileName != undefined) {
      worker.postMessage({
        filePath: `../data/${fileName}`,
        method: 'local',
        fileType: dataType,
        delimiter: delimiter,
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
      })
    }
    worker.onmessage = onWorkerMessage
  }

  const terminateWorker = async () => {
    if (worker != undefined) {
      worker?.terminate()
    }
  }

  $: {
    if (file != null) {
      terminateWorker()
      loadWorker()
      updateTable()
    }
  }

  onMount(loadWorker)

  if (updateData == null) {
    updateData = async (index: string, value: string) => {
      const indexes = index.split('-')
      worker?.postMessage({
        editData: {
          index: index,
          value: value,
        },
        filter: $filters,
        order: $sorting,
        pagination: $pagination,
      })
    }
  }

  $: {
    if (mapping != null && map == true) {
      worker?.postMessage({
        mapping: mapping,
      })
      map = false
    }
  }
</script>

<div data-component="download-container">
  {#if worker != undefined}
    <FileDownload bind:worker />
  {/if}
</div>
{#key update}
  <DataTableRendererBasic
    {hasData}
    {filters}
    {sorting}
    {pagination}
    {rowEvent}
    {editable}
    {updateData}
    {ownEditorVisuals}
    {ownEditorMethods}
  />
{/key}
