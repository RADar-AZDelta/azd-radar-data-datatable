<script lang="ts">
  import Sorting from './Sorting.svelte'
  import Filtering from './Filtering.svelte'
  import Pagination from './Pagination.svelte'
  import type ISort from '$lib/interfaces/ISort'
  import SortDirection from '../../classes/enums/SortDirection'
  import { writable, type Writable } from 'svelte/store'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import Types from '../../classes/enums/Types'
  import Spinner from '../Extra/Spinner.svelte'
  import { onMount } from 'svelte'
  import type ITableData from '$lib/interfaces/ITableData'
  import type IScheme from '$lib/interfaces/IScheme'
  import { loading } from '../../store'

  export let hasData: Function,
    filters: Writable<Array<IFilter>>,
    sorting: Writable<Array<ISort>>,
    pagination: Writable<IPaginated>,
    pagesShown: number = 7,
    scheme: Writable<IScheme[]> | undefined

  const data = writable<ITableData | null>(null)

  let dataSmallerThanRows = writable<boolean>(
    $data != null && $data != undefined ? $data.data.length < $pagination.rowsPerPage : true
  )
  let moreRowsThanOnPage = writable<boolean>(
    $pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0
  )
  let restingRows = writable<number>(
    $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)
  )

  const updateSorting = async (col: string, direction: number): Promise<void> => {
    /*
      Update the column sort
    */
    const sortsFound = $sorting.filter(obj => obj.column == col)

    if (direction == SortDirection.Descending) {
      // If the previous direction was descending --> remove it from sorting because the next direction is none
      $sorting = Array.from(new Set($sorting.filter(obj => obj.column != col)))
    } else if (sortsFound.length > 0) {
      // If the column was already in the sorting --> update the direction + 1
      const index = $sorting.findIndex(obj => obj.column == col)
      $sorting[index] = {
        column: col,
        direction: direction + 1,
      }
    } else {
      // If the column was not in the sorting --> add it to the sorting
      $sorting.push({
        column: col,
        direction: 1,
      })
    }

    // Fallback for when it goes out of bounds --> remove it from sorting, so start from none
    if (sortsFound.length > 0 && (sortsFound[0].direction > 2 || sortsFound[0].direction < 0))
      $sorting = Array.from(new Set($sorting.filter(obj => obj.column != col)))
    sorting.update(() => $sorting)
    changePage(1)
  }

  const changePage = async (page: number): Promise<void> => {
    /*
      Update the current page
    */
    if (page > $pagination.totalPages) page--
    else if (page < 1) page = 1
    if (page != $pagination.currentPage) {
      $pagination = {
        currentPage: page,
        totalPages: $pagination.totalPages,
        rowsPerPage: $pagination.rowsPerPage,
        totalRows: $pagination.totalRows,
      }
    }
  }

  async function updateRowsPerPage(event: Event): Promise<void> {
    /*
      Update the rows per page
    */
    const rowsSelected = event.target as HTMLInputElement
    if (Number(rowsSelected.value) != $pagination.rowsPerPage) {
      $pagination = {
        currentPage: 1,
        totalPages: $pagination.totalPages,
        rowsPerPage: Number(rowsSelected.value),
        totalRows: $pagination.totalRows,
      }
    }
  }

  async function updateFiltering(event: Event, type?: any): Promise<void> {
    const element = event.target as HTMLInputElement
    let filterValue: string | number | RegExp | Date | boolean = element.value
    const filterColumn: string = element.id

    switch (filterValue && type) {
      case filterValue != undefined && type == Types.number:
        filterValue = Number(filterValue)
        break

      case filterValue != undefined && type == Types.regex:
        filterValue = new RegExp(filterValue)
        break

      case filterValue != undefined && type == Types.date:
        filterValue = new Date(filterValue)
        break

      case filterValue != undefined && type == Types.boolean:
        filterValue = filterValue == 'true' ? true : false
        break

      default:
        break
    }

    const index = $filters.indexOf($filters.filter((filter: IFilter) => filter.column == filterColumn)[0])
    // If the filter does exists --> update it
    if (index != -1) {
      $filters[index] = {
        column: filterColumn,
        filter: filterValue,
      }
      // If the filter does not exist --> add it
    } else {
      $filters.push({
        column: filterColumn,
        filter: filterValue,
      })
    }
    changePage(1)
    filters.update(() => $filters)
  }

  const deleteFilter = async (column: string): Promise<void> => {
    // Remove the filter from the filters array
    $filters.splice($filters.indexOf($filters.filter(obj => obj.column == column)[0]), 1)
    filters.update(() => $filters)
  }

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm

  const callbackFunction = async (): Promise<void> => {
    if ($data != null) {
      loading.set(true)
      const results = await hasData()
      data.set(results)
      loading.set(false)
    }
  }

  $: {
    $filters, $sorting, $pagination
    callbackFunction()
  }

  $: {
    $data, $pagination
    dataSmallerThanRows.set(
      $data != null && $data != undefined
        ? $data.data != undefined
          ? $data.data.length < $pagination.rowsPerPage
          : true
        : true
    )
    moreRowsThanOnPage.set($pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0)
    restingRows.set(
      $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)
    )
  }

  onMount(async () => {
    await hasData().then((results: any) => {
      data.set(results)
      scheme != undefined ? scheme.set(results.scheme) : writable<IScheme[]>(results.scheme)
    })
  })
</script>

<!-- Create a table with readonly cells -->
<section class="container is-fluid">
  {#if $data != null && $data.data != undefined && ($data.scheme != undefined || $scheme != undefined)}
    <div data-component="tablerenderer">
      <div class="table-container">
        <table class="table">
          {#if $$slots.columns}
            <slot
              name="columns"
              columns={$scheme != undefined ? $scheme : $data.scheme}
              sorting={$sorting}
              {updateSorting}
              {deleteFilter}
              {updateFiltering}
              {filters}
            />
          {:else}
            <tr>
              {#each $scheme != undefined ? $scheme : $data.scheme as info}
                {#if info.visible == true}
                  <th>
                    <div>
                      <div class="control">
                        <Sorting
                          col={info.column}
                          direction={$sorting.filter(obj => obj.column == info.column)[0] != undefined
                            ? $sorting.filter(obj => obj.column == info.column)[0].direction
                            : 0}
                          {updateSorting}
                        />
                      </div>
                      <div class="control">
                        <Filtering col={info.column} type={info.type} {deleteFilter} {updateFiltering} bind:filters />
                      </div>
                    </div>
                  </th>
                {/if}
              {/each}
            </tr>
          {/if}
          {#each Array($dataSmallerThanRows ? $data.data.length : $moreRowsThanOnPage ? $pagination.rowsPerPage : $restingRows) as _, i}
            {#if $$slots.row}
              <slot
                name="row"
                row={$data.data[i]}
                scheme={$scheme != undefined ? $scheme : $data.scheme}
                id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
                number={i}
              />
            {:else}
              <tr id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}>
                {#each $data.data[i] as row, j}
                  {#if $data.scheme[j] != undefined || $scheme != undefined}
                    {#if $data.scheme[j].visible == true || ($scheme != undefined && $scheme[j] != undefined && $scheme[j].visible == true)}
                      <td class="cell">
                        <div class="cell-container">
                          <p class="content" id="{i + $pagination.rowsPerPage * ($pagination.currentPage - 1)}-{j}">
                            {row}
                          </p>
                        </div>
                      </td>
                    {/if}
                  {/if}
                {/each}
              </tr>
            {/if}
          {/each}
        </table>
      </div>
      <Pagination {updateRowsPerPage} {changePage} bind:pagination {pagesShown} />
    </div>
  {:else}
    <Spinner />
    <button
      on:click={() => {
        console.log($data)
      }}>Test</button
    >
  {/if}
</section>

<style>
  .container {
    margin-left: 0px;
    margin-right: 0px;
    padding: 0px;
  }
  .content {
    padding-right: 1px;
  }
  .cell {
    padding: 1px 1px 1px 1px;
    vertical-align: bottom;
  }
  tr {
    line-height: 10px;
  }
  th {
    padding: 0.25em 0.1em;
  }
</style>
