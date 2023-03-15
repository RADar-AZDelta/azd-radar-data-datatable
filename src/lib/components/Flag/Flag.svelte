<script lang="ts">
  import type { Writable } from 'svelte/store'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'

  export let worker: Worker | undefined
  export let selectedRow: Writable<string>
  export let parentChange: Writable<boolean>
  export let author: string | null = null
  export let popUpEvent: Function | null = null

  if (browser == true) {
    if (author == null) {
      if (localStorage.getItem('Author') !== null) {
        author = localStorage.getItem('Author')
      } else {
        if (popUpEvent != null) popUpEvent()
        else author = 'LocalEmpty test'
      }
    }
  } else author = 'SSR test'

  const loadWorker = async () => {
    if (worker != undefined) {
      worker.postMessage({
        flagged: {
          flag: true,
          flaggedBy: author,
          row: $selectedRow,
        },
      })
      parentChange.set(true)
    }
  }
</script>

<button data-component="button-flag" on:click={loadWorker}>Flag</button>
