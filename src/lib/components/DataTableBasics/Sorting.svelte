<script lang="ts">
  import SortDirection from '$lib/classes/enums/SortDirection'
  export let col: string, direction: number, updateSorting: Function
</script>

<div data-component="sort">
  <button on:click={updateSorting(col, direction)}>
    <p data-component="column-name">{col}</p>
    {#if direction == SortDirection.None}
      <img src="/no-sort.svg" alt="No filter icon" />
    {:else if direction == SortDirection.Ascending}
      <img src="/ascending-sort.svg" alt="Ascending filter icon" />
    {:else if direction == SortDirection.Descending}
      <img src="/descending-sort.svg" alt="Descending filter icon" />
    {:else}
      <p>Error in sorting!</p>
    {/if}
  </button>
</div>
