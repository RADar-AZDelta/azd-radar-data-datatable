<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { CustomTableEvents } from './DataTable.d.js'
  import { range } from '../utils.js'
  import SvgIcon from './SvgIcon.svelte'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'

  export let rowsPerPage: number = 20,
    currentPage: number = 1,
    rowsPerPageOptions: number[] = [5, 10, 20, 50, 100],
    totalRows: number,
    disabled: boolean

  const dispatch = createEventDispatcher<CustomTableEvents>()

  $: fromRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  $: toRow = fromRow + rowsPerPage > totalRows ? totalRows : fromRow + rowsPerPage - 1
  $: totalPages = Math.ceil(totalRows / rowsPerPage)
  $: pages = calculatePages(currentPage, totalPages)

  function calculatePages(currentPage: number, totalPages: number): (number | null)[] {
    // 7 buttons
    // 1   2  3  4  5   6   7 (total pages is less or equal then 7)
    // 1   2  3  4  5 ... 100
    // 1 ... 49 50 51 ... 100
    // 1 ... 96 97 98  99 100
    if (totalPages < 7) {
      return range(1, totalPages, 1)
    } else {
      if (currentPage < 5) return [1, 2, 3, 4, 5, null, totalPages]
      else if (currentPage > totalPages - 5) return [1, null, ...range(totalPages - 4, totalPages, 1)]
      else return [1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages]
    }
  }

  function onChangeRowsPerPage(e: Event) {
    const value = parseInt((e!.target as HTMLSelectElement)!.value)
    dispatch('paginationChanged', { rowsPerPage: value, currentPage })
  }
  function onChangePage(newPage: number) {
    dispatch('paginationChanged', { rowsPerPage, currentPage: newPage })
  }
</script>

<div data-name="pagination-container">
  <p>Rows:</p>
  <select bind:value={rowsPerPage} on:change={onChangeRowsPerPage} {disabled}>
    {#each rowsPerPageOptions ?? [] as value}
      <option {value}>{value}</option>
    {/each}
  </select>
  <p>
    {fromRow}-{toRow} of {totalRows}
  </p>
</div>
<div data-name="pagination-container-pages">
  <button disabled={!totalRows || currentPage === 1 || disabled} on:click={() => onChangePage(currentPage - 1)}>
    <SvgIcon href="icons.svg" id="arrow-left" width="16px" height="16px" />
  </button>
  {#each pages as page}
    <button data-active={currentPage === page} disabled={!page || disabled} on:click={() => onChangePage(page)}
      >{page ? page : '...'}</button
    >
  {/each}
  <button disabled={!totalRows || currentPage === totalPages || disabled} on:click={() => onChangePage(currentPage + 1)}>
    <SvgIcon href="icons.svg" id="arrow-right" width="16px" height="16px" />
  </button>
</div>
