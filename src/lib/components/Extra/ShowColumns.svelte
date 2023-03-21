<script lang="ts">
  import type IScheme from '$lib/interfaces/IScheme'
  import { each } from 'svelte/internal'
  import { writable, type Writable } from 'svelte/store'
  export let columns: Writable<Array<IScheme>> = writable<Array<IScheme>>([]),
    parentChange: Writable<boolean>

  const hiddenColumns = ['sourceAutoAssignedConceptIds', 'ADD_INFO:additionalInfo', 'ADD_INFO:prescriptionID', 'ADD_INFO:ATC', 'matchScore', 'mappingStatus', 'statusSetOn', 'comment', 'createdBy', 'createdOn']
</script>

<section>
  <h3 class="title is-5">Columns shown:</h3>
  <div>
    {#each $columns as column}
      <span class="check">
        <label class="checkbox"
          ><input
            type="checkbox"
            id={column.column}
            bind:checked={column.visible}
            on:change={() => parentChange.set(true)}
          /></label
        >
        <label for={column.column}>{column.column}</label>
      </span>
    {/each}
  </div>
</section>

<style>
  .check:nth-child(5n):after {
    content: ' ';
    display: block;
  }
</style>
