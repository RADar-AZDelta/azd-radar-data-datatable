<script lang="ts">
  import '$lib/styles/table.scss'
  import Sorting from './Sorting.svelte'
  import Filtering from './Filtering.svelte'
  import Pagination from './Pagination.svelte'
  import type ISort from '$lib/interfaces/ISort'
  import SortDirection from '../../classes/enums/SortDirection'
  import type { Writable } from 'svelte/store'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import Types from '../../classes/enums/Types'

  export let hasData: Function,
    filters: Writable<Array<IFilter>>,
    sorting: Writable<Array<ISort>>,
    pagination: Writable<IPaginated>,
      rowEvent: Function | null = null,
      editable: boolean = false,
      ownEditorVisuals: any = null,
      ownEditorMethods: any = null,
      updateData: Function | null = null

  let update = 0

  const updateTable = async () => {
    /*
			Force an update of the table when sorting, filtering or pagination changes
		*/
    update += 1
  }

  const updateSorting = async (col: string, direction: number) => {
    /*
            Update the column sort
        */

    if (direction == SortDirection.Descending) {
      // If the previous direction was descending --> remove it from sorting because the next direction is none
      sorting.update((sort): ISort[] => {
        const sorting = Array.from(new Set(sort.filter(obj => obj.column != col)))
        return sorting
      })
    } else if ($sorting.filter(obj => obj.column == col)[0] != undefined) {
      // If the column was already in the sorting --> update the direction + 1
      sorting.update((sort): ISort[] => {
        const index = sort.findIndex(obj => obj.column == col)
        sort[index] = {
          column: col,
          direction: direction + 1,
        }
        return sort
      })
    } else {
      // If the column was not in the sorting --> add it to the sorting
      sorting.update((sort): ISort[] => {
        const sorting = sort
        sorting.push({
          column: col,
          direction: 1,
        })
        return sorting
      })
    }

    // Fallback for when it goes out of bounds --> remove it from sorting, so start from none
    if (
      $sorting.filter(obj => obj.column == col).length > 0 &&
      ($sorting.filter(obj => obj.column == col)[0].direction > 2 ||
        $sorting.filter(obj => obj.column == col)[0].direction < 0)
    )
      sorting.update((sort): ISort[] => {
        const sorting = Array.from(new Set(sort.filter(obj => obj.column != col)))
        return sorting
      })

    changePage(1)
    updateTable()
  }

  const changePage = async (page: number) => {
    /*
            Update the pagination
        */
    if (page > $pagination.totalPages) page--
    else if (page < 1) page = 1
    pagination.set({
      currentPage: page,
      totalPages: $pagination.totalPages,
      rowsPerPage: $pagination.rowsPerPage,
      totalRows: $pagination.totalRows,
    })
    updateTable()
  }

  async function updateRowsPerPage(event: any) {
    /*
            Update the rows per page
        */
    pagination.set({
      currentPage: 1,
      totalPages: $pagination.totalPages,
      rowsPerPage: Number(event.target.value),
      totalRows: $pagination.totalRows,
    })
    updateTable()
  }

  async function updateFiltering(event: any, type: any) {
    changePage(1)
    let filterValue = event.target.value
    const filterColumn: string = event.target.placeholder.split(' ')[2]

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

    filters.update((filters): IFilter[] => {
      const index = filters.indexOf(filters.filter((filter: IFilter) => filter.column == filterColumn)[0])
      // If the filter does exists --> update it
      if (index != -1) {
        filters[index] = {
          column: filterColumn,
          filter: filterValue,
        }
        // If the filter does not exist --> add it
      } else {
        filters.push({
          column: filterColumn,
          filter: filterValue,
        })
      }
      return filters
    })

    updateTable()
  }

  const deleteFilter = async (column: string) => {
    // Remove the filter from the filters array
    $filters.splice($filters.indexOf($filters.filter(obj => obj.column == column)[0]), 1)
    updateTable()
  }

  /*
    Inline editor
  */

  let eventListener: string
  let originalEvent: string
  let parent: any
  let updating: boolean = false

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm
  // TODO: place long calculations in a computed property (make it understandable for others)

  const listener = async () => {
    if (originalEvent == eventListener) {
      if (parent.firstChild.nodeName == 'INPUT') {
        return
      } else {
        parent?.firstChild?.remove()
        parent?.appendChild(document.createElement('input'))
        updating = true
      }
    }
  }

  const editor = async (event: any) => {
    console.log(event)
    parent = document.getElementById(event)
    if (eventListener != event && updating == false) {
      eventListener = event
      parent?.addEventListener('click', listener)
    } else if (eventListener != event && updating == true) {
      parent?.removeEventListener('click', listener)
      // @ts-ignore
      const value = document.getElementById(eventListener)?.firstChild?.value
      document.getElementById(eventListener)?.firstChild?.remove()
      const tag = document.createElement('p')
      tag.appendChild(document.createTextNode(value))
      document.getElementById(eventListener)?.appendChild(tag)
      if(updateData != null){
        updateData(eventListener, value)
      }

      eventListener = event
      updating = false
      parent?.addEventListener('click', listener, true)
    } else {
      originalEvent = event
    }
  }
</script>

<section>
  {#key update}
    {#await hasData()}
      <p>Loading...</p>
    {:then data}
      <div data-component="tablerenderer">
        <h2>Information Table</h2>
        <table>
          <tr>
            {#each data.scheme as info}
              <th>
                <Sorting
                  col={info.column}
                  direction={$sorting.filter(obj => obj.column == info.column)[0] != undefined
                    ? $sorting.filter(obj => obj.column == info.column)[0].direction
                    : 0}
                  {updateSorting}
                />
                <Filtering
                  col={info.column}
                  type={info.type}
                  {deleteFilter}
                  {updateFiltering}
                  filter={$filters.filter(obj => obj.column == info.column)[0]}
                />
              </th>
            {/each}
          </tr>

          {#if data.data.length < $pagination.rowsPerPage}
            {#each Array(data.data.length) as _, i}
              <tr
                on:click={() => {
                  if (rowEvent != null) rowEvent()
                }}
              >
                {#each data.data[i] as row, j}
                  <td
                    id="{i}-{j}"
                    on:click={function () {
                      if (editable != false && ownEditorMethods == null && ownEditorVisuals == null) editor(this.id)
                    }}
                    on:keypress={function () {
                      if (editable != false && ownEditorMethods == null && ownEditorVisuals == null) editor(this.id)
                    }}>{row}</td
                  >
                {/each}
              </tr>
            {/each}
          {:else}
            {#each Array($pagination.totalRows - $pagination.rowsPerPage * $pagination.currentPage > 0 ? $pagination.rowsPerPage : $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - $pagination.totalRows)) as _, i}
              <tr
                on:click={() => {
                  if (rowEvent != null) rowEvent(true)
                }}
              >
                {#each data.data[i] as row, j}
                  <td
                    id="{i}-{j}"
                    on:click={function () {
                      if (editable != false && ownEditorMethods == null && ownEditorVisuals == null) editor(this.id)
                    }}
                    on:keypress={function () {
                      if (editable != false && ownEditorMethods == null && ownEditorVisuals == null) editor(this.id)
                    }}><p>{row}</p></td
                  >
                {/each}
              </tr>
            {/each}
          {/if}
        </table>
        <Pagination {updateRowsPerPage} {changePage} {data} pagination={$pagination} />
      </div>
    {/await}
  {/key}
</section>
