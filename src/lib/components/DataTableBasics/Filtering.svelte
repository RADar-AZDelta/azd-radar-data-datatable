<script lang="ts">
  import Types from '$lib/classes/enums/Types'
  import type IFilter from '$lib/interfaces/IFilter'

  export let col: string, type: Types, updateFiltering: Function, deleteFilter: Function, filter: IFilter
</script>

<div data-component="filter">
  <input
    on:change={updateFiltering(event, type)}
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
    value={filter == undefined ? '' : filter.filter}
    placeholder="filter by {col}"
  />
  <button on:click={deleteFilter(col)}><img src="/x.svg" alt="Cross icon" /></button>
</div>
