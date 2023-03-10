<script lang="ts">
  import { table } from 'arquero'

  export let worker: Worker | null = null,
    data: any | null = null

  // let worker: Worker | undefined = undefined
  let csv: any
  let delimiter = ','
  let tableData: any

  const loadWorker = async () => {
    // const w = await import('../../workers/csr.worker?worker')
    // worker = new w.default()
    if (worker != null) {
      worker.postMessage({
        getCSV: true,
      })

      worker.onmessage = onWorkerMessage
    } else if (data != null && data != undefined) {
      console.log('this is the file')
      transpileData(data)
    } else {
      console.log('Give at least a worker or a file to the component')
    }
  }

  const onWorkerMessage = async (data: any) => {
    //get data in table format
    tableData = data.data.processedData.data
    //arquero to csv
    csv = table(tableData).toCSV({ delimiter: delimiter })

    const file = new Blob([csv], { type: 'text/csv' })
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
    a.download = 'test.csv'
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
</script>

<button on:click={loadWorker}>Download CSV</button>
