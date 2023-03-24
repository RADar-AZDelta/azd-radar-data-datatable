<script lang="ts">
  import type { Writable } from 'svelte/store'
  import { browser } from '$app/environment'
  import type IColumn from '$lib/interfaces/IColumn'

  export let worker: Worker | undefined
  export let selectedRow: Writable<string>
  export let parentChange: Writable<boolean>
  export let author: string | null = null
  export let popUpEvent: Function | null = null

  const getAuthor = async () => {
    let auth = author
    if (browser == true) {
      console.log('AUTHOR ', author)
      if (auth == null) {
        if (localStorage.getItem('author') !== null) {
          auth = localStorage.getItem('author')
        } else {
          if (popUpEvent != null) popUpEvent()
          else auth = 'LocalEmpty test'
        }
      }
    } else auth = 'SSR test'

    return auth
  }

  const loadWorker = async () => {
    if (worker != undefined) {
      let author = await getAuthor()
      const flagging = {
        row: $selectedRow,
        data: {
          mappingStatus: 'FLAGGED',
          assignedReviewer: author,
        },
      }
      const expectedColumns: Array<IColumn> = [
        {
          name: 'mappingStatus',
          altName: 'mappingStatus',
        },
        {
          name: 'assignedReviewer',
          altName: 'assignedReviewer',
        },
      ]
      worker.postMessage({
        flagging: flagging,
        expectedColumns: expectedColumns,
      })
      parentChange.set(true)
    }
  }
</script>

<button data-component="button-flag" on:click={loadWorker}>Flag</button>
