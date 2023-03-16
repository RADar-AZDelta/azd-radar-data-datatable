<script lang="ts">
  import type Types from '$lib/classes/enums/Types'
  import type { Writable } from 'svelte/store'
  import type IFilter from '../../interfaces/IFilter'

  export let col: string, type: Types, updateFiltering: Function, deleteFilter: Function, filters: Writable<IFilter[]>
</script>

<div data-component="filter">
  <input
    id={col}
    on:change={() => {
      updateFiltering(event, type)
    }}
    name={col}
    {type}
    value={$filters.filter(obj => obj.column == col)[0] == undefined
      ? ''
      : $filters.filter(obj => obj.column == col)[0].filter}
    placeholder="Filter"
  />
  <button on:click={deleteFilter(col)}><img src="/x.svg" alt="Cross icon" /></button>
</div>
