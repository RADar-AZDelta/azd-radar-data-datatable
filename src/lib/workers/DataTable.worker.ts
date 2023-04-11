import type { MessageRequestFetchData, MessageRequestLoadFile, PostMessage, WorkerMessageRequests, WorkerMessageResponses } from "./messages"
import { dev } from "$app/environment"
import { desc, escape, loadJSON, loadCSV, op } from 'arquero'
import type ColumnTable from 'arquero/dist/types/table/column-table'

let dt: ColumnTable

onmessage = async ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageRequests>>) => {
  // if (dev)
  //   console.log(`WORKER onmessage: ${JSON.stringify({ msg, data })}`)

  switch (msg) {
    case 'loadFile':
      await loadFile(data as MessageRequestLoadFile)
      break;
    case 'getColumnNames':
      getColumnNames()
      break;
    case "fetchData":
      await fetchData(data as MessageRequestFetchData)
      break;
  }
};

async function loadFile(data: MessageRequestLoadFile) {
  switch (data.extension) {
    case 'csv':
      dt = await loadCSV(data.url, {})
      break;
    case 'json':
      dt = await loadJSON(data.url, {})
      break;
    default:
      throw new Error(`Unknown extension '${data.extension}'`);
  }

  const message: PostMessage<WorkerMessageResponses> = {
    msg: 'loadFile',
    data
  };
  postMessage(message);
}

function getColumnNames() {
  const columnNames = dt.columnNames()
  const message: PostMessage<WorkerMessageResponses> = {
    msg: 'getColumnNames',
    data: { columnNames }
  };
  postMessage(message);
}

async function fetchData(data: MessageRequestFetchData) {
  const start = performance.now();

  //filter
  let tempDt = dt
  for (const [column, filter] of [...data.filteredColumns].values()) {
    //if (dev) console.log(`Applying filter '${filter}' on column '${column}'`)
    const lowerCaseFilter = filter?.toString().toLowerCase()
    //tempDt = tempDt.filter((d) => op.lower(d[column]).includes(lowerCaseFilter))
    tempDt = tempDt.filter(escape((d: any) => {
      return op.lower(d[column]).includes(lowerCaseFilter) //op.includes(op.lower(d[column]), str(filter))
    }))
  }
  //sort
  for (let [column, sortDirection] of [...data.sortedColumns].reverse()) {
    //Sort is applied in reverse order !!!
    //if (dev) console.log(`Applying sort order '${sortDirection}' on column '${column}'`)
    switch (sortDirection) {
      case 'asc':
        tempDt = tempDt.orderby(column)
        break
      case 'desc':
        tempDt = tempDt.orderby(desc(column))
        break
    }
  }
  //pagination
  const totalRows = tempDt.numRows()
  const objects = tempDt.objects({ limit: data.pagination.rowsPerPage, offset: (data.pagination.currentPage - 1) * data.pagination.rowsPerPage })
  const matrix = objects.map(obj => Object.values(obj))

  const end = performance.now();
  console.log(`fetchData Execution time: ${end - start} ms`);

  const message: PostMessage<WorkerMessageResponses> = {
    msg: 'fetchData',
    data: { totalRows, data: matrix }
  };
  postMessage(message);
}

export default {};