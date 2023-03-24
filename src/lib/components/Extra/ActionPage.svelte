<script lang="ts">
  import type { Writable } from 'svelte/store'
  import type IColumnName from '$lib/interfaces/IColumnName'

  export let name: string,
    firstRow: number,
    lastRow: number,
    updateColumns: Array<IColumnName>,
    worker: Worker | undefined,
    parentChange: Writable<boolean>

  const loadWorker = async () => {
    if (worker != undefined) {
      const action = {
        startRow: firstRow,
        endRow: lastRow,
        expectedColumns: updateColumns,
      }
      worker.postMessage({
        actionPage: action,
      })
      parentChange.set(true)
    } else {
      console.warn('Provide a worker to use actions')
    }
  }
</script>

<button class="button is-small" data-component="button-approve" on:click={loadWorker}>{name}</button>

<style>
</style>
