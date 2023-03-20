<script lang="ts">
  import type IScheme from '$lib/interfaces/IScheme'
  import { writable, type Writable } from 'svelte/store'

  export let columns: Writable<Array<IScheme>> = writable<Array<IScheme>>([]),
    parentChange: Writable<boolean>
</script>

<section>
  <h3>Columns shown</h3>
  {#each $columns as column}
    <input type="checkbox" id={column.column} bind:checked={column.visible} on:change={() => parentChange.set(true)} />
    <label for={column.column}>{column.column}</label>
  {/each}
</section>
