<script lang="ts">
  import type { Writable } from 'svelte/store'

  export let updateFiltering: Function, deleteFilter: Function, filter: Writable<string>
</script>

<div data-component="filter">
  <input
    on:change={() => {
      updateFiltering(event)
    }}
    value={$filter == undefined ? '' : $filter}
    placeholder="Filter"
  />
  <button on:click={deleteFilter()}><img src="/x.svg" alt="Cross icon" /></button>
</div>
