<script lang="ts">
  import type { Writable } from 'svelte/store'
  import Types from '../../classes/enums/Types'
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
    type={type == Types.string
      ? 'text'
      : type == Types.number
      ? 'number'
      : type == Types.boolean
      ? 'checkbox'
      : type == Types.date
      ? 'date'
      : 'text'}
    value={$filters.filter(obj => obj.column == col)[0] == undefined
      ? ''
      : $filters.filter(obj => obj.column == col)[0].filter}
    placeholder="Filter"
  />
  <button on:click={deleteFilter(col)}><img src="/x.svg" alt="Cross icon" /></button>
</div>
