<script lang="ts">
  import Sorting from './Sorting.svelte'
  import FilteringGeneral from './FilteringGeneral.svelte'
  import Pagination from './Pagination.svelte'
  import type ISort from '$lib/interfaces/ISort'
  import SortDirection from '../../classes/enums/SortDirection'
  import { writable, type Writable } from 'svelte/store'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import Types from '../../classes/enums/Types'
  import Spinner from '../Extra/Spinner.svelte'
  import type ITableData from '$lib/interfaces/ITableData'
  import { onMount } from 'svelte'
  import type IScheme from '$lib/interfaces/IScheme'

  export let hasData: Function,
    filter: Writable<string | number | RegExp | Date | boolean> = writable(''),
    sorting: Writable<ISort>,
    pagination: Writable<IPaginated>,
    pagesShown: number = 7,
    scheme: Writable<IScheme[]> | undefined

  const data = writable<ITableData | null>(null)

  let dataSmallerThanRows = writable<boolean>($data != null ? $data.data.length < $pagination.rowsPerPage : true)
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
    if (direction == SortDirection.Descending) {
      $sorting = {
        column: col,
        direction: SortDirection.None,
      }
    } else if ($sorting != undefined || $sorting != null) {
      if ($sorting.column == undefined || $sorting.column == null || $sorting.column != col) {
        $sorting = {
          column: col,
          direction: 1,
        }
      } else {
        $sorting = {
          column: col,
          direction: direction + 1,
        }
      }
    } else {
      $sorting = {
        column: col,
        direction: 1,
      }
    }

    if ($sorting.direction < 0 || $sorting.direction > 2) {
      $sorting = {
        column: col,
        direction: SortDirection.None,
      }
    }
    sorting.update(() => $sorting)
    changePage(1)
  }

  const changePage = async (page: number): Promise<void> => {
    /*
        Update the pagination
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
    const element = event.target as HTMLInputElement
    $pagination = {
      currentPage: 1,
      totalPages: $pagination.totalPages,
      rowsPerPage: Number(element.value),
      totalRows: $pagination.totalRows,
    }
  }

  async function updateFiltering(event: Event, type?: any): Promise<void> {
    changePage(1)
    const element = event.target as HTMLInputElement
    let filterValue: string | number | RegExp | Date | boolean = element.value

    if (type) {
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
    }

    $filter = filterValue
    filter.update(() => $filter)
  }

  const deleteFilter = async (): Promise<void> => {
    // Remove the filter from the filters array
    $filter = ''
    filter.update(() => $filter)
  }

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm

  const callbackFunction = async (): Promise<void> => {
    if ($data != null) {
      $data = await hasData()
    }
  }

  $: {
    $filter, $sorting, $pagination
    callbackFunction()
  }

  $: {
    $data, $pagination
    dataSmallerThanRows.set(
      $data != null ? ($data.data != undefined ? $data.data.length < $pagination.rowsPerPage : true) : true
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

<section class="container">
  {#if $data != null && $data.data != undefined && ($data.scheme != undefined || $scheme != undefined)}
    <div data-component="tablerenderer">
      <div>
        <FilteringGeneral bind:filter {deleteFilter} {updateFiltering} />
      </div>
      <div class="table-container">
        <table class="table is-narrow">
          {#if $$slots.columns}
            <slot
              name="columns"
              columns={$scheme != undefined ? $scheme : $data.scheme}
              sorting={$sorting}
              {updateSorting}
              {deleteFilter}
              {updateFiltering}
              {filter}
            />
          {:else}
            <tr>
              {#each $scheme != undefined ? $scheme : $data.scheme as info}
                {#if info.visible == true}
                  <th>
                    <Sorting
                      col={info.column}
                      direction={$sorting == undefined ? 0 : $sorting.column == info.column ? $sorting.direction : 0}
                      {updateSorting}
                    />
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
                number={Number(i)}
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
  {/if}
</section>

<style>
  .container {
    margin-left: 0%;
    margin-right: 0%;
  }
  .content {
    padding-right: 5px;
  }
</style>
