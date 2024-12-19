<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { range, debounce } from '@dtlib/utils'
  import SvgIcon from '@dtlib/components/general/SvgIcon.svelte'
  import type { IPaginationProps } from '@dtlib/interfaces/Types.js'

  let { paginationChanged, dt }: IPaginationProps = $props()

  let disabled = $derived(dt?.disabled)
  let currentPage = $derived(dt?.internalOptions.currentPage ?? 1)
  let rowsPerPage = $derived(dt?.internalOptions.rowsPerPage ?? 20)
  let rowsPerPageOptions = $derived(dt?.internalOptions.rowsPerPageOptions ?? [5, 10, 20, 50, 100])
  let totalRows = $derived(dt?.internalOptions.totalRows ?? 0)
  let paginationThroughArrowsOnly = $derived(dt?.internalOptions.paginationThroughArrowsOnly ?? false)
  let fromRow = $derived(totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1)
  let toRow = $derived(fromRow + rowsPerPage > totalRows ? totalRows : fromRow + rowsPerPage - 1)
  let totalPages = $derived(Math.ceil(totalRows / rowsPerPage))
  let pages = $derived(calculatePages(currentPage, totalPages))

  function calculatePages(currentPage: number, totalPages: number): (number | null)[] {
    /*
      7 buttons
      1   2  3  4  5   6   7 (total pages is less or equal then 7)
      1   2  3  4  5 ... 100
      1 ... 49 50 51 ... 100
      1 ... 96 97 98  99 100
    */
    if (totalPages < 7) return range(1, totalPages, 1)
    if (currentPage < 5) return [1, 2, 3, 4, 5, null, totalPages]
    else if (currentPage > totalPages - 4) return [1, null, ...range(totalPages - 4, totalPages, 1)]
    else return [1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages]
  }

  function onChangeRowsPerPage(e: Event) {
    const value = parseInt((e!.target as HTMLSelectElement)!.value)
    changePagination(value, currentPage)
  }

  function onChangePage(newPage: number | null) {
    if (!newPage) return
    changePagination(rowsPerPage, newPage)
  }

  const onChangeInputPage = debounce(e => onChangePage(e.target.value), 500)

  async function changePagination(rowsPerPage: number, currentPage: number) {
    await dt?.onPaginationChanged(rowsPerPage, currentPage)
    if (paginationChanged) await paginationChanged(rowsPerPage, currentPage)
  }

  $effect(() => {
    if (currentPage > totalPages && totalPages !== 0) onChangePage(1)
  })
</script>

<div data-name="pagination-container">
  <p>Rows:</p>
  <select value={rowsPerPage} onchange={onChangeRowsPerPage} {disabled}>
    {#each rowsPerPageOptions ?? [] as value}
      <option {value}>{value}</option>
    {/each}
  </select>
  <p>{fromRow}-{toRow} of {totalRows}</p>
</div>
<div data-name="pagination-container-pages">
  <button
    disabled={!totalRows || currentPage === 1 || disabled}
    onclick={() => onChangePage(currentPage - 1)}
    id="Previous page {Math.random()}"
    aria-label="Previous page"
  >
    <SvgIcon id="arrow-left" />
  </button>
  {#if !paginationThroughArrowsOnly}
    {#each pages as page, i}
      {#if page}
        <button data-active={currentPage === page} disabled={!page || disabled} onclick={() => onChangePage(page)}>{page}</button>
      {:else if pages[0] && pages[2] && pages[2] - pages[0] > 2 && i == 1}
        <p>...</p>
      {:else}
        <input type="number" data-name="pagination-input" oninput={onChangeInputPage} />
      {/if}
    {/each}
  {/if}
  <button
    disabled={!totalRows || currentPage === totalPages || disabled}
    onclick={() => onChangePage(currentPage + 1)}
    id="Next page {Math.random()}"
    aria-label="Next page"
  >
    <SvgIcon id="arrow-right" />
  </button>
</div>
