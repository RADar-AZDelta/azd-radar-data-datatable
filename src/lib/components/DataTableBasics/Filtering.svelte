<script lang="ts">
  import type Types from '$lib/classes/enums/Types'
  import type { Writable } from 'svelte/store'
  import type IFilter from '../../interfaces/IFilter'

  export let col: string, type: Types, updateFiltering: Function, deleteFilter: Function, filters: Writable<IFilter[]>
</script>

<div class="field has-addons">
  <div class="control" data-component="filter">
    <input
      class="input is-small"
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
  </div>
  <div class="control">
    <button class="button is-small" on:click={deleteFilter(col)}><img src="/x.svg" alt="Cross icon" /></button>
  </div>
</div>
