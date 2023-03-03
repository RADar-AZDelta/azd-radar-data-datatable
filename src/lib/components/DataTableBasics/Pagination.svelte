<script lang="ts">
  import type ITableData from '$lib/interfaces/ITableData'
  import type IPaginated from '$lib/interfaces/IPaginated'

  export let updateRowsPerPage: Function, changePage: Function, data: ITableData, pagination: IPaginated

  let pagesShown = 7
</script>

<section data-component="pagination">
  <div data-component="pagination-rows">
    <p>Rows:</p>
    <select bind:value={pagination.rowsPerPage} id="rows" on:change={() => updateRowsPerPage(event)}>
      {#each Array(5) as _, i}
        <option value={(i + 1) * 10}>{(i + 1) * 10}</option>
      {/each}
    </select>
    <p>
      {pagination.rowsPerPage * pagination.currentPage + 1 - pagination.rowsPerPage}-
      {data.data.length - pagination.rowsPerPage * pagination.currentPage > 0
        ? pagination.rowsPerPage
        : pagination.rowsPerPage * pagination.currentPage > data.data.length
        ? pagination.totalRows
        : pagination.rowsPerPage * pagination.currentPage}
      of {pagination.totalRows}
    </p>
  </div>
  <div data-component="pagination-pages">
    <button
      on:click={() => changePage(pagination.currentPage - 1)}
      class={`${pagination.currentPage == 1 ? 'arrow-button-disable' : null}`}
      ><img src="/arrow-left.svg" alt="Arrow left" /></button
    >
    {#each Array(pagination.totalPages > 7 ? 7 : pagination.totalPages) as _, i}
      <button
        on:click={() => {
          if (
            pagination.currentPage > Math.floor(pagesShown / 2) + 1 &&
            pagination.currentPage + Math.floor(pagesShown / 2) + 1 <= pagination.totalPages
          )
            changePage(pagination.currentPage + i - Math.floor(pagesShown / 2))
          else if (
            pagination.currentPage > Math.floor(pagesShown / 2) + 1 &&
            pagination.currentPage + Math.floor(pagesShown / 2) >= pagination.totalPages
          )
            changePage(pagination.totalPages + i - (pagesShown - 1))
          else changePage(i + 1)
        }}
      >
        {#if pagination.currentPage > Math.floor(pagesShown / 2) + 1 && pagination.currentPage + Math.floor(pagesShown / 2) + 1 <= pagination.totalPages}
          <p
            class={`${
              pagination.currentPage == pagination.currentPage + i - Math.floor(pagesShown / 2)
                ? 'pagination-page-selected'
                : null
            }`}
          >
            {pagination.currentPage + i - Math.floor(pagesShown / 2)}
          </p>
        {:else if pagination.currentPage > Math.floor(pagesShown / 2) + 1 && pagination.currentPage + Math.floor(pagesShown / 2) >= pagination.totalPages}
          <p
            class={`${
              pagination.currentPage == pagination.totalPages + i - (pagesShown - 1) ? 'pagination-page-selected' : null
            }`}
          >
            {pagination.totalPages + i - (pagesShown - 1)}
          </p>
        {:else}
          <p class={`${pagination.currentPage == i + 1 ? 'pagination-page-selected' : null}`}>
            {i + 1}
          </p>
        {/if}
      </button>
    {/each}
    <button
      on:click={() => changePage(pagination.currentPage + 1)}
      class={`${pagination.currentPage == pagination.totalPages ? 'arrow-button-disable' : null}`}
      ><img src="/arrow-right.svg" alt="Arrow right" /></button
    >
  </div>
</section>
