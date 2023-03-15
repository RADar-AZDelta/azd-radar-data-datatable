<script lang="ts">
  export let worker: Worker | null = null

  let author = localStorage.getItem('Author')
  const loadWorker = async () => {
    if (worker != null) {
      worker.postMessage({
        approving: {
          approved: true,
          approvedBy: author,
          row: 0, // later selectedrow store
        },
      })

      worker.onmessage = onWorkerMessage
    }
  }

  const onWorkerMessage = async (data: any) => {}
</script>

<button on:click={loadWorker}>Approve</button>
