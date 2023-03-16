<script lang="ts">
  import '$lib/styles/table.scss'
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
  import SkeletonTable from '../Extra/SkeletonTable.svelte'
  import { onMount } from 'svelte'
  import type ITableData from '$lib/interfaces/ITableData'
  import Editor from '../Extra/Editor.svelte'

  export let hasData: Function,
    filters: Writable<Array<IFilter>>,
    sorting: Writable<Array<ISort>>,
    pagination: Writable<IPaginated>,
    pagesShown: number = 7,
    parentChange: Writable<boolean> = writable(false),
    rowEvent: Function | null = null,
    ownEditorVisuals: any = null,
    ownEditorMethods: any = null,
    updateData: Function | null = null,
    selectedRow: Writable<string>

  const data = writable<ITableData | null>(null)
  let editorUpdating = writable<boolean>(false)
  let editClick = writable<boolean>(false)

  let dataSmallerThanRows = writable<boolean>($data != null ? $data.data.length < $pagination.rowsPerPage : true)
  let moreRowsThanOnPage = writable<boolean>(
    $pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0
  )
  let restingRows = writable<number>(
    $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)
  )

  let updated = writable<boolean>(false)

  const updateSorting = async (col: string, direction: number) => {
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
    updated.set(false)
    changePage(1)
  }

  const changePage = async (page: number) => {
    /*
      Update the current page
    */
    if (page > $pagination.totalPages) page--
    else if (page < 1) page = 1
    $pagination = {
      currentPage: page,
      totalPages: $pagination.totalPages,
      rowsPerPage: $pagination.rowsPerPage,
      totalRows: $pagination.totalRows,
    }
    updated.set(false)
  }

  async function updateRowsPerPage(event: any) {
    /*
      Update the rows per page
    */
    $pagination = {
      currentPage: 1,
      totalPages: $pagination.totalPages,
      rowsPerPage: Number(event.target.value),
      totalRows: $pagination.totalRows,
    }
    updated.set(false)
  }

  async function updateFiltering(event: any, type: any) {
    changePage(1)
    let filterValue = event.target.value
    const filterColumn: string = event.target.id

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
    filters.update(() => $filters)
    updated.set(false)
  }

  const deleteFilter = async (column: string) => {
    // Remove the filter from the filters array
    $filters.splice($filters.indexOf($filters.filter(obj => obj.column == column)[0]), 1)
    filters.update(() => $filters)
    updated.set(false)
  }

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm

  const callbackFunction = async () => {
    if ($data != null && ($updated == false || $parentChange == true)) {
      $data = await hasData()
      updated.set(true)
    }
  }

  $: {
    $filters, $sorting, $pagination
    callbackFunction()
  }

  $: {
    if ($parentChange == true || $updated == false) {
      callbackFunction()
      $parentChange = false
    }
  }

  $: {
    $data, $pagination
    dataSmallerThanRows.set($data != null ? $data!.data.length < $pagination.rowsPerPage : true)
    moreRowsThanOnPage.set($pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0)
    restingRows.set(
      $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)
    )
  }

  onMount(async () => {
    await hasData().then((results: any) => {
      data.set(results)
      updated.set(true)
    })
  })
</script>

<!-- Create a table with readonly cells -->
<section>
  {#if $data != null}
    <div data-component="tablerenderer">
      <table>
        <tr>
          {#each $data.scheme as info}
            <th>
              <Sorting
                col={info.column}
                direction={$sorting.filter(obj => obj.column == info.column)[0] != undefined
                  ? $sorting.filter(obj => obj.column == info.column)[0].direction
                  : 0}
                {updateSorting}
              />
              <Filtering col={info.column} type={info.type} {deleteFilter} {updateFiltering} bind:filters />
            </th>
          {/each}
        </tr>
        {#each Array($dataSmallerThanRows ? $data.data.length : $moreRowsThanOnPage ? $pagination.rowsPerPage : $restingRows) as _, i}
          <tr
            id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
            on:click={function () {
              if ($selectedRow != String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))) {
                $selectedRow = String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
              } else {
                if (rowEvent != null && $editorUpdating == false && $editClick == false) rowEvent(event, true)
                editClick.set(false)
              }
            }}
            class={`${
              $selectedRow == String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1)) ? 'selected-row' : ''
            }`}
          >
            {#each $data.data[i] as row, j}
              <td class="cell"
                ><div class="cell-container" data-component="cell-container">
                  <p id="{i + $pagination.rowsPerPage * ($pagination.currentPage - 1)}-{j}">{row}</p>
                  {#if $data.scheme[j].editable == true}
                    <Editor
                      col={j}
                      row={i}
                      bind:updateData
                      bind:updated
                      bind:editClick
                      bind:editorUpdating
                      {ownEditorMethods}
                      {ownEditorVisuals}
                    />
                  {/if}
                </div></td
              >
            {/each}
          </tr>
        {/each}
      </table>
      <Pagination {updateRowsPerPage} {changePage} bind:pagination {pagesShown} />
    </div>
  {:else}
    <Spinner />
  {/if}
</section>
