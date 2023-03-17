<script lang="ts">
  // import '$lib/styles/table.scss'
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

  export let hasData: Function,
    filters: Writable<Array<IFilter>>,
    sorting: Writable<Array<ISort>>,
    pagination: Writable<IPaginated>,
    parentChange: Writable<boolean> = writable(false),
    rowEvent: Function | null = null,
    ownEditorVisuals: any = null,
    ownEditorMethods: any = null,
    updateData: Function | null = null,
    selectedRow: Writable<string>

  const data = writable<ITableData | null>(null)

  let updated = false

  const updateSorting = async (col: string, direction: number) => {
    /*
      Update the column sort
    */
    if (direction == SortDirection.Descending) {
      // If the previous direction was descending --> remove it from sorting because the next direction is none
      $sorting = Array.from(new Set($sorting.filter(obj => obj.column != col)))
    } else if ($sorting.filter(obj => obj.column == col)[0] != undefined) {
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
    if (
      $sorting.filter(obj => obj.column == col).length > 0 &&
      ($sorting.filter(obj => obj.column == col)[0].direction > 2 ||
        $sorting.filter(obj => obj.column == col)[0].direction < 0)
    )
      $sorting = Array.from(new Set($sorting.filter(obj => obj.column != col)))
    sorting.update(() => $sorting)
    updated = false
    changePage(1)
  }

  const changePage = async (page: number) => {
    /*
            Update the pagination
        */
    if (page > $pagination.totalPages) page--
    else if (page < 1) page = 1
    $pagination = {
      currentPage: page,
      totalPages: $pagination.totalPages,
      rowsPerPage: $pagination.rowsPerPage,
      totalRows: $pagination.totalRows,
    }
    updated = false
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
    updated = false
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
    updated = false
  }

  const deleteFilter = async (column: string) => {
    // Remove the filter from the filters array
    $filters.splice($filters.indexOf($filters.filter(obj => obj.column == column)[0]), 1)
    filters.update(() => $filters)
    updated = false
  }

  /*
    Inline editor
  */

  let eventListener: string
  let updatedParent: string[] = []
  let parent: any
  let updating: boolean = false
  let editClick: boolean = false

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm
  // TODO: place long calculations in a computed property (make it understandable for others)

  const editor = async (event: string) => {
    parent = document.getElementById(event)
    if (eventListener != event && updating == false) {
      eventListener = event
      let value: string
      if (parent.firstChild.data == undefined) value = parent.firstChild.innerText
      else value = parent.firstChild.data
      parent?.firstChild.remove()
      const input = document.createElement('input')
      input.value = value
      parent?.appendChild(input)
      updating = true
      if (updatedParent.filter(obj => obj == event).length == 0) {
        updatedParent.push(event)
        parent.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter') {
            editor(event)
          }
        })
      }
    } else if (eventListener == event && updating == true) {
      // @ts-ignore
      const value = document.getElementById(event)?.firstChild?.value
      parent?.firstChild.remove()
      const tag = document.createElement('p')
      tag.appendChild(document.createTextNode(value))
      parent?.appendChild(tag)
      if (updateData != null) {
        // TODO: edit
        updated = true
        updateData(event, value)
      }

      updating = false
      eventListener = ''
    }
  }

  const callbackFunction = async () => {
    if ($data != null && (updated == false || $parentChange == true)) {
      $data = await hasData()
      updated = true
    }
  }

  $: {
    $filters, $sorting, $pagination
    callbackFunction()
  }

  $: {
    if ($parentChange == true || updated == false) {
      callbackFunction()
      $parentChange = false
    }
  }

  onMount(async () => {
    await hasData().then((results: any) => {
      data.set(results)
      updated = true
    })
  })
</script>

<!-- Create a table with readonly cells -->
<section>
  {#if $data != null}
    <div data-component="tablerenderer">
      <table class="table">
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

        {#if $data.data.length < $pagination.rowsPerPage}
          {#each Array($data.data.length) as _, i}
            <tr
              id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
              on:click={function () {
                if ($selectedRow != String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))) {
                  $selectedRow = String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                } else {
                  if (rowEvent != null && updating == false && editClick == false) rowEvent(event, true)
                  editClick = false
                }
              }}
              class={`${
                $selectedRow == String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                  ? 'selected-row'
                  : ''
              }`}
            >
              {#each $data.data[i] as row, j}
                <td class="cell"
                  ><div class="cell-container">
                    <p id="{i + $pagination.rowsPerPage * ($pagination.currentPage - 1)}-{j}">{row}</p>
                    {#if $data.scheme[j].editable == true}
                      <button
                        on:click={function () {
                          editClick = true
                          if ($data?.scheme[j].editable == true && ownEditorMethods == null && ownEditorVisuals == null)
                            editor(`${i}-${j}`)
                        }}
                        class="button-edit"><img src="/edit.svg" alt="Edit the cell" /></button
                      >
                    {/if}
                  </div></td
                >
              {/each}
            </tr>
          {/each}
        {:else}
          {#each Array($pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0 ? $pagination.rowsPerPage : $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)) as _, i}
            <tr
              id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
              on:click={function () {
                if ($selectedRow != String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))) {
                  $selectedRow = String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                } else {
                  if (rowEvent != null && updating == false && editClick == false) rowEvent(event, true)
                  editClick = false
                }
              }}
              class={`${
                $selectedRow == String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))
                  ? 'selected-row'
                  : ''
              }`}
            >
              {#each $data.data[i] as row, j}
                <td class="cell"
                  ><div class="cell-container">
                    <p id="{i + $pagination.rowsPerPage * ($pagination.currentPage - 1)}-{j}">{row}</p>
                    {#if $data.scheme[j].editable == true}
                      <button
                        on:click={function () {
                          editClick = true
                          if ($data?.scheme[j].editable == true && ownEditorMethods == null && ownEditorVisuals == null)
                            editor(`${i}-${j}`)
                        }}
                        class="button-edit"><img src="/edit.svg" alt="Edit the cell" /></button
                      >
                    {/if}
                  </div></td
                >
              {/each}
            </tr>
          {/each}
        {/if}
      </table>
      <Pagination {updateRowsPerPage} {changePage} bind:pagination />
    </div>
  {:else}
    <Spinner />
  {/if}
</section>

<style>
  .cell-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .button-edit {
    background: none;
    border: none;
    cursor: pointer;
    display: none;
  }

  .cell:hover .button-edit {
    display: block;
  }

  .selected-row {
    background-color: #b2b2b2;
  }
</style>
