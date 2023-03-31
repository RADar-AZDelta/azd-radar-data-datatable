<script lang="ts">
  import type IPaginated from '$lib/interfaces/IPaginated'
  import { writable, type Writable } from 'svelte/store'
  import { loading } from '../../store'

  export let updateRowsPerPage: Function, changePage: Function, pagination: Writable<IPaginated>, pagesShown: number

  let paginationLength = writable<number>($pagination.totalPages > pagesShown ? pagesShown : $pagination.totalPages)
  let firstRowOfPage = writable<number>($pagination.rowsPerPage * $pagination.currentPage + 1 - $pagination.rowsPerPage)
  let restingRows = writable<number>($pagination.totalRows - $pagination.rowsPerPage * ($pagination.currentPage - 1))
  let lastRowOfPage = writable<number>($pagination.rowsPerPage * $pagination.currentPage)
  let allRowsOfPage = writable<number>($pagination.rowsPerPage * ($pagination.currentPage - 1))
  let currentPageBiggerThanHalf = writable<boolean>($pagination.currentPage > Math.floor(pagesShown / 2) + 1)
  let currentPageSmallerThanTotal = writable<boolean>(
    $pagination.currentPage + Math.floor(pagesShown / 2) + 1 <= $pagination.totalPages
  )
  let currentPageBiggerThanTotal = writable<boolean>(
    $pagination.currentPage + Math.floor(pagesShown / 2) >= $pagination.totalPages
  )

  // Update the values when the pagination changes
  $: {
    $pagination
    paginationLength.set($pagination.totalPages > pagesShown ? pagesShown : $pagination.totalPages)
    firstRowOfPage.set($pagination.rowsPerPage * $pagination.currentPage + 1 - $pagination.rowsPerPage)
    restingRows.set($pagination.totalRows - $pagination.rowsPerPage * ($pagination.currentPage - 1))
    lastRowOfPage.set($pagination.rowsPerPage * $pagination.currentPage)
    allRowsOfPage.set($pagination.rowsPerPage * ($pagination.currentPage - 1))
    currentPageBiggerThanHalf.set($pagination.currentPage > Math.floor(pagesShown / 2) + 1)
    currentPageSmallerThanTotal.set($pagination.currentPage + Math.floor(pagesShown / 2) + 1 <= $pagination.totalPages)
    currentPageBiggerThanTotal.set($pagination.currentPage + Math.floor(pagesShown / 2) >= $pagination.totalPages)
  }
</script>

<section data-component="pagination">
  <div data-component="pagination-rows">
    <p>Rows:</p>
    <div class="select is-small">
      <select bind:value={$pagination.rowsPerPage} id="rows" on:change={() => updateRowsPerPage(event)}>
        {#each Array(4) as _, i}
          <option value={(i + 1) * 10}>{(i + 1) * 10}</option>
        {/each}
      </select>
    </div>
    <p>
      {$firstRowOfPage}-
      {$restingRows > 0
        ? $lastRowOfPage
        : $allRowsOfPage > $pagination.totalRows
        ? $pagination.totalRows
        : $lastRowOfPage}
      of {$pagination.totalRows}
    </p>
  </div>
  <div data-component="pagination-pages">
    <button class="button is-small" on:click={() => {if($loading != true) changePage($pagination.currentPage - 1)}}
      ><img src="/arrow-left.svg" alt="Arrow left" /></button
    >
    {#each Array($paginationLength) as _, i}
      <button
        class="button is-small"
        on:click={() => {
          if ($currentPageBiggerThanHalf && $currentPageSmallerThanTotal)
            changePage($pagination.currentPage + i - Math.floor(pagesShown / 2))
          else if ($currentPageBiggerThanHalf && $currentPageBiggerThanTotal)
            changePage($pagination.totalPages + i - (pagesShown - 1))
          else changePage(i + 1)
        }}
      >
        {#if $currentPageBiggerThanHalf && $currentPageSmallerThanTotal}
          <p
            class={`${
              $pagination.currentPage == $pagination.currentPage + i - Math.floor(pagesShown / 2) ? 'tag is-dark' : null
            }`}
          >
            {$pagination.currentPage + i - Math.floor(pagesShown / 2)}
          </p>
        {:else if $currentPageBiggerThanHalf && $currentPageBiggerThanTotal}
          <p
            class={`${$pagination.currentPage == $pagination.totalPages + i - (pagesShown - 1) ? 'tag is-dark' : null}`}
          >
            {$pagination.totalPages + i - (pagesShown - 1)}
          </p>
        {:else}
          <p class={`${$pagination.currentPage == i + 1 ? 'tag is-dark' : null}`}>
            {i + 1}
          </p>
        {/if}
      </button>
    {/each}
    <button on:click={() => {if($loading != true) changePage($pagination.currentPage + 1)}} class="button is-small"
      ><img src="/arrow-right.svg" alt="Arrow right" /></button
    >
  </div>
</section>
