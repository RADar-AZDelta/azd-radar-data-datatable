<script lang="ts">
  import type ISort from '$lib/interfaces/ISort'
  import { writable, type Writable } from 'svelte/store'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ITableData from '$lib/interfaces/ITableData'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte'
  import FileDownload from '../FileDownload/FileDownload.svelte'

  export let data: Writable<[string, any][][]>,
    columns: IScheme[],
    downloadable: boolean = false,
    updateData: Function | undefined = undefined,
    pagination: Writable<IPaginated> = writable<IPaginated>({
      currentPage: 1,
      totalPages: 1,
      rowsPerPage: 20,
      totalRows: 10,
    }),
    customCode: boolean = true

  const columnsStore = writable<IScheme[]>(columns)
  const dataStore = writable<[string, any][][]>()
  export let filters = writable<Array<IFilter>>([])
  export let sorting = writable<Array<ISort>>([])
  export let dataChanged = writable<boolean>(false)

  const setColumnFilters = async (filters: IFilter[]): Promise<void> => {
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
            Apply extra filters if given
        */
    if (filters.length > 0) {
      // Remove eventual duplicates first
      const extraFilteredData: [string, any][][] = Array.from(new Set(filteredData)).filter(elem => elem != undefined)
      for (let filter of filters) {
        const colIndex = $columnsStore.findIndex(obj => obj.column == filters[filters.indexOf(filter)].column)
        // Make sure the filter is of the correct type
        switch (typeof filter.filter) {
          case 'string':
            for (let person of extraFilteredData) {
              if (person != undefined) {
                if (String(person[colIndex]).toLowerCase().includes(filter.filter.toLowerCase()) != true) {
                  delete extraFilteredData[extraFilteredData.indexOf(person)]
                }
              }
            }
            break
          case 'number':
            for (let person of extraFilteredData) {
              if (person != undefined) {
                if (Number(person[colIndex]) != filter.filter) {
                  delete extraFilteredData[extraFilteredData.indexOf(person)]
                }
              }
            }
            break

          case 'boolean':
            for (let person of extraFilteredData) {
              if (person != undefined) {
                if (Boolean(person[colIndex]) != filter.filter) {
                  delete extraFilteredData[extraFilteredData.indexOf(person)]
                }
              }
            }
            break
          default:
            if (filter instanceof RegExp) {
              for (let person of extraFilteredData) {
                if (person != undefined) {
                  if (filter.test(String(person[colIndex])) == false) {
                    delete extraFilteredData[extraFilteredData.indexOf(person)]
                  }
                }
              }
            } else if (filter instanceof Date) {
              for (let person of extraFilteredData) {
                if (person != undefined) {
                  if (filter.getTime() != new Date(person[colIndex][0]).getTime()) {
                    delete extraFilteredData[extraFilteredData.indexOf(person)]
                  }
                }
              }
            }
            break
        }
      }
      // Remove eventual duplicates
      filteredData = Array.from(new Set(extraFilteredData)).filter(elem => elem != undefined)
    }
    $dataStore = filteredData
  }

  const setColumnSort = async (sorting: ISort[]): Promise<void> => {
    let filteredData: [string, any][][] = $dataStore

    for (let sort of sorting) {
      const colIndex = $columnsStore.findIndex(obj => obj.column == sort.column)
      switch (sort.direction) {
        case 1:
          filteredData = $dataStore.sort(function (a, b) {
            if (b[colIndex] > a[colIndex]) return -1
            if (b[colIndex] < a[colIndex]) return 1
            return 0
          })
          break

        case 2:
          filteredData = $dataStore.sort(function (a, b) {
            if (b[colIndex] < a[colIndex]) return -1
            if (b[colIndex] > a[colIndex]) return 1
            return 0
          })
          break
      }
    }
    dataStore.set(filteredData)
  }

  const setTablePagination = async (tablePagination: IPaginated): Promise<void> => {
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
				Third: If needed, sort data
				Finally: Resolve the data and scheme
			*/
      await setColumnFilters($filters)
        .then(() => {
          setTablePagination({
            currentPage: $pagination.currentPage,
            totalPages: Math.ceil($dataStore.length / $pagination.rowsPerPage),
            rowsPerPage: $pagination.rowsPerPage,
            totalRows: $data.length,
          })
        })
        .then(() => {
          if ($sorting.length > 0) setColumnSort($sorting)
        })
        .finally(() => {
          resolve({ data: $dataStore, scheme: $columnsStore })
        })
    })
  }

  const hasData = async (): Promise<ITableData> => {
    return new Promise(async (resolve, reject) => {
      resolve(await getData())
    })
  }

  // TODO: make it possible to update data with ex. only numbers
  if (updateData == undefined) {
    updateData = async (index: string, value: string): Promise<void> => {
      const indexes = index.split('-')
      const row = Number(indexes[0])
      const col = Number(indexes[1])
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

{#if downloadable == true}
  <div data-component="download-container">
    {#if $data != undefined || $data != null}
      <FileDownload data={$data} />
    {/if}
  </div>
{/if}

{#if customCode == true}
  <DataTableRendererBasic {hasData} bind:filters bind:sorting bind:pagination bind:parentChange={dataChanged}>
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
    />
    <slot name="row" slot="row" let:row let:scheme let:id let:number {row} {id} {number} {scheme} />
  </DataTableRendererBasic>
{:else}
  <DataTableRendererBasic {hasData} bind:filters bind:sorting bind:pagination bind:parentChange={dataChanged} />
{/if}
