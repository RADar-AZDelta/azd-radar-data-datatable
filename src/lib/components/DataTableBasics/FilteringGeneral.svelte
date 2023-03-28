<script lang="ts">
  import { debounce } from 'lodash'
  import type { Writable } from 'svelte/store'

  export let updateFiltering: Function,
    deleteFilter: Function,
    filter: Writable<string | number | RegExp | Date | boolean>

  const handleInput = debounce(e => {
    updateFiltering(e)
  }, 500)
</script>

<div data-component="filter">
  <input on:input={handleInput} bind:value={$filter} placeholder="Filter" />
  <button on:click={deleteFilter()}><img src="/x.svg" alt="Cross icon" /></button>
</div>
