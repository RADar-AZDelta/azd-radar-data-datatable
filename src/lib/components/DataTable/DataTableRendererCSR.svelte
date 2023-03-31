<script lang="ts">
  import type IFilter from '$lib/interfaces/IFilter'
  import type IMapper from '$lib/interfaces/IMapper'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'
  import type ITableData from '$lib/interfaces/ITableData'
  import type IWorkerMessage from '$lib/interfaces/IWorkerMessage'
  import { onMount } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
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
    mapping: any | undefined = undefined,
    map: Writable<boolean> = writable<boolean>(false),
    selectedRow: Writable<number> = writable(),
    selectedRowPage: Writable<number> = writable(0),
    autoMapping: boolean = false,
    customCode: boolean = true

  export let worker: Worker | undefined = undefined

  export let filters: Writable<Array<IFilter>>
  export let sorting: Writable<Array<ISort>>
  export let pagination: Writable<IPaginated>
  export let mapper: Writable<IMapper> = writable<IMapper>()

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
        mapper: $mapper,
        autoMapping: autoMapping,
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

  const onWorkerMessage = async (data: IWorkerMessage): Promise<void> => {
    // Check what has changed and update the stores if needed
    if (data.data.columns != $columns) {
      $columns = data.data.columns
    }
    if (data.data.data != $data) $data = data.data.data
    const pag = data.data.pagination
    if (pag != undefined) {
      if (
        pag.currentPage != $pagination.currentPage ||
        pag.rowsPerPage != $pagination.rowsPerPage ||
        pag.totalPages != $pagination.totalPages ||
        pag.totalRows != $pagination.totalRows
      ) {
        // EDIT THIS
        $pagination = data.data.pagination!
      }
    }
    workerMess.set(true)
    if (data.data.update == true) {
      pagination.set($pagination)
    }
  }

  const loadWorker = async (): Promise<void> => {
    const w = await import('../../workers/csr.worker?worker')
    worker = new w.default()
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
        mapper: $mapper,
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
        mapper: $mapper,
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
        mapper: $mapper,
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
    if (mapping != undefined && $map == true) {
      worker?.postMessage({
        mapping: mapping,
        expectedColumns: $mapper.expectedColumns,
        columns: $columns,
      })
      $map = false
    }
  }

  $: {
    $selectedRow
    $selectedRowPage =
      ($selectedRow == undefined ? 0 : $selectedRow) - ($pagination.currentPage - 1) * $pagination.rowsPerPage
  }

  onMount(loadWorker)
</script>

<section>
  <div id="data">
    {#if customCode == true}
      <DataTableRendererBasic {hasData} bind:filters bind:sorting bind:pagination bind:scheme={columns}>
        <slot
          name="columns"
          slot="columns"
          let:columns
          let:sorting
          let:updateSorting
          let:deleteFilter
          let:updateFiltering
          let:filters
          {columns}
          {sorting}
          {updateSorting}
          {deleteFilter}
          {updateFiltering}
          {filters}
          {worker}
        />
        <slot name="row" slot="row" let:row let:scheme let:id let:number {row} {id} {number} {scheme} {worker} />
      </DataTableRendererBasic>
    {:else}
      <DataTableRendererBasic {hasData} bind:filters bind:sorting bind:pagination bind:scheme={columns} />
    {/if}
  </div>
  <slot name="extra" {worker} />
  <div id="download" class="download">
    {#if downloadable == true}
      <div data-component="download-container">
        {#if worker != undefined}
          <FileDownload bind:worker workerMessage={onWorkerMessage} />
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  section {
    font-size: 12px;
  }

  .download {
    margin-top: -50px;
    margin-left: 5px;
  }
</style>
