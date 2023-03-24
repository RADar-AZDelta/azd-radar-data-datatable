<script lang="ts">
  //import '$lib/styles/table.scss'
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
  import type IStatus from '$lib/interfaces/IStatus'
  import type IColor from '$lib/interfaces/IColor'

  export let hasData: Function,
    statusScheme: IStatus[],
    filters: Writable<Array<IFilter>>,
    sorting: Writable<Array<ISort>>,
    pagination: Writable<IPaginated>,
    pagesShown: number = 7,
    parentChange: Writable<boolean> = writable(false),
    rowEvent: Function | undefined = undefined,
    ownEditorVisuals: any = undefined,
    ownEditorMethods: any = undefined,
    updateData: Function | undefined = undefined,
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
    updated.set(false)
    changePage(1)
  }

  const changePage = async (page: number): Promise<void> => {
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

  async function updateRowsPerPage(event: any): Promise<void> {
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

  async function updateFiltering(event: any, type: any): Promise<void> {
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

  const deleteFilter = async (column: string): Promise<void> => {
    // Remove the filter from the filters array
    $filters.splice($filters.indexOf($filters.filter(obj => obj.column == column)[0]), 1)
    filters.update(() => $filters)
    updated.set(false)
  }

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm

  const callbackFunction = async (): Promise<void> => {
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
      updated.set(true)
    })
  })

  $: {
    statusScheme
    let count = 0
    for (let status of statusScheme) {
      status.priority += count
      // count += 1
    }
  }

  function checkStatuses(row: number) {
    const allStatuses = statusScheme.filter(obj => {
      if (
        $data?.scheme.indexOf($data.scheme.filter(col => col.column.toLowerCase() == obj.column.toLowerCase())[0]) != -1
      ) {
        if (
          obj.status.toLowerCase() ==
          $data?.data[row][
            $data?.scheme.indexOf($data.scheme.filter(col => col.column.toLowerCase() == obj.column.toLowerCase())[0])
          ].toLowerCase()
        ) {
          return obj
        }
      }
    })
    if (allStatuses.length > 0) {
      return true
    } else {
      return false
    }
  }

  function getColorFromStatus(row: number) {
    const allStatuses = statusScheme.filter(obj => {
      if (
        obj.status.toLowerCase() ==
        $data?.data[row][
          $data?.scheme.indexOf($data.scheme.filter(col => col.column.toLowerCase() == obj.column.toLowerCase())[0])
        ].toLowerCase()
      ) {
        return obj
      }
    })
    const priority = Math.max(...allStatuses.map(status => status.priority))
    const status = allStatuses.filter(status => status.priority == priority)[0]
    return status.color
  }
</script>

<!-- Create a table with readonly cells -->
<section class="container is-fluid">
  {#if $data != null && $data.data != undefined && $data.scheme != undefined}
    <div data-component="tablerenderer">
      <div class="table-container">
        <table class="table is-narrow">
          <tr>
            {#if $$slots.customHeader}
              <slot name="customHeader" />
            {/if}
            {#each $data.scheme as info}
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
          {#each Array($dataSmallerThanRows ? $data.data.length : $moreRowsThanOnPage ? $pagination.rowsPerPage : $restingRows) as _, i}
            <tr
              id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
              on:click={function () {
                if ($selectedRow != String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))) {
                  $selectedRow = String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                } else {
                  if (rowEvent != undefined && $editorUpdating == false && $editClick == false) rowEvent(event, true)
                  editClick.set(false)
                }
              }}
              style={`${checkStatuses(i) ? `background-color: ${getColorFromStatus(i)};` : ''}`}
              class={`${
                $selectedRow == String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                  ? 'selected-row'
                  : ''
              }`}
            >
              {#if $$slots.customColumn}
                <slot row={i} name="customColumn" />
              {/if}
              {#each $data.data[i] as row, j}
                {#if $data.scheme[j] != undefined}
                  {#if $data.scheme[j].visible == true}
                    <td class="cell">
                      <div class="field has-addons" data-component="cell-container">
                        <p class="content" id="{i + $pagination.rowsPerPage * ($pagination.currentPage - 1)}-{j}">
                          {row}
                        </p>
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
                      </div>
                    </td>
                  {/if}
                {/if}
              {/each}
            </tr>
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
  .cell {
    padding: 1px 1px 1px 1px;
    vertical-align: middle;
  }
  tr {
    line-height: 10px;
  }
</style>
