<script lang="ts">
  import { table } from 'arquero'

  export let worker: Worker | null = null,
    data: any | null = null

  let csv: any
  let delimiter = ','
  let tableData: any

  const loadWorker = async () => {
    if (worker != null) {
      worker.postMessage({
        getCSV: true,
      })

      worker.onmessage = onWorkerMessage
    } else if (data != null && data != undefined) {
      // When there is no worker given
      transpileData(data)
    } else {
      console.log('Give at least a worker or a file to the component')
    }
  }

  const onWorkerMessage = async (data: any) => {
    csv = data.data.processedData.data
    const file = new Blob([tableData], { type: 'text/csv' })
    // https://stackoverflow.com/questions/71309058/property-showsavefilepicker-does-not-exist-on-type-window-typeof-globalthis
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
    downloadCsv(file)
  }

  const transpileData = async (data: any) => {
    console.log(data)
    const tableData: any = {}
    let colCount = 0
    if (data.scheme) {
      for (let col of data.scheme) {
        tableData[col.column] = []
        for (let row of data.data) {
          tableData[col.column].push(row[colCount])
        }
        colCount += 1
      }
    } else {
      const columns = []
      for (let col of data[0]) {
        columns.push(col[0])
      }
      for (let col of columns) {
        tableData[col] = []
        for (let row of data) {
          tableData[col].push(row[colCount][1])
        }
        colCount += 1
      }
    }

    csv = table(tableData).toCSV({ delimiter: delimiter })

    const file = new Blob([csv], { type: 'text/csv' })
    downloadCsv(file)
  }

  const downloadCsv = async (file: any) => {
    // const filename = csv.meta?.filename || new Date().toISOString() + '.csv'

    let a = document.createElement('a')
    let url = URL.createObjectURL(file)

    a.href = url
    a.download = 'mapped-data.csv'
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
</script>

<button data-component="button-download" on:click={loadWorker}>
  <p>Download CSV</p>
  <img src="/download.svg" alt="Download icon" />
</button>
