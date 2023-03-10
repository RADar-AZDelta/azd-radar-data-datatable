<script lang="ts">
  import { table } from 'arquero'

  let worker: Worker | undefined = undefined
  let csv: any
  let delimiter = ','
  let tableAQ: any

  const loadWorker = async () => {
    const w = await import('../../workers/csr.worker?worker')
    worker = new w.default()
    worker.postMessage({
      getCSV: true,
    })

    worker.onmessage = downloadCsv
  }

  const downloadCsv = async (data: any) => {
    //get data in table format
    tableAQ = data.data.processedData.data
    //arquero to csv
    csv.table(tableAQ).toCSV(delimiter)

    const file = new Blob([csv], { type: 'text/csv' })
    const filename = csv.meta?.filename || new Date().toISOString() + '.csv'

    let a = document.createElement('a')
    let url = URL.createObjectURL(file)

    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
</script>

<button on:click={loadWorker}>Download CSV</button>
