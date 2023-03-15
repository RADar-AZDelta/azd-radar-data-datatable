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
  import FilteringGeneral from './FilteringGeneral.svelte'

  export let hasData: Function,
    filter: Writable<string>,
    sorting: Writable<ISort>,
    pagination: Writable<IPaginated>,
    parentChange: Writable<boolean> = writable(false),
    rowEvent: Function | null = null,
    ownEditorVisuals: any = null,
    ownEditorMethods: any = null,
    updateData: Function | null = null

  const data = writable<ITableData | null>(null)

  let updated = false

  const updateSorting = async (col: string, direction: number) => {
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

    $filter = filterValue
    filter.update(() => $filter)
    updated = false
  }

  const deleteFilter = async () => {
    // Remove the filter from the filters array
    $filter = ''
    filter.update(() => $filter)
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
    $filter, $sorting, $pagination
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

<section>
  {#if $data != null}
    <div data-component="tablerenderer">
      <div>
        <FilteringGeneral bind:filter {deleteFilter} {updateFiltering} />
      </div>
      <table>
        <tr>
          {#each $data.scheme as info}
            <th>
              <Sorting
                col={info.column}
                direction={$sorting == undefined ? 0 : $sorting.column == info.column ? $sorting.direction : 0}
                {updateSorting}
              />
            </th>
          {/each}
        </tr>

        {#if $data.data.length < $pagination.rowsPerPage}
          {#each Array($data.data.length) as _, i}
            <tr
              id={String(i + $pagination.rowsPerPage * ($pagination.currentPage - 1))}
              on:click={function () {
                if (rowEvent != null && updating == false && editClick == false) rowEvent(event, true)
                editClick = false
              }}
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
                if (rowEvent != null && updating == false && editClick == false) rowEvent(event, true)
                editClick = false
              }}
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
      <Pagination {updateRowsPerPage} {changePage} data={$data} bind:pagination />
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
</style>
