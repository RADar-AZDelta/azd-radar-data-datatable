<script lang="ts">
  import type { Writable } from 'svelte/store'
  import type IColumnName from '$lib/interfaces/IColumnName'

  export let name: string,
    updateColumns: Array<IColumnName>,
    worker: Worker | undefined,
    selectedRow: Writable<string>,
    parentChange: Writable<boolean>,
    row: string | undefined = undefined

  const loadWorker = async () => {
    if (worker != undefined) {
      let currentRow = '0'
      if (row != undefined) currentRow = row
      else currentRow = $selectedRow
      const action = {
        row: currentRow,
        expectedColumns: updateColumns,
      }
      worker.postMessage({
        action: action,
      })
      parentChange.set(true)
    } else {
      console.warn('Provide a worker to use actions')
    }
  }
</script>

<button class="button is-small" on:click={loadWorker}>{name}</button>

<style>
  .button {
    border: 0;
    background-color: inherit;
    padding-left: 2px;
    padding-right: 2px;
  }
</style>
