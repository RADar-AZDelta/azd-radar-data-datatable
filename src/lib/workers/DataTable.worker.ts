//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import { dev } from '$app/environment'
import type Column from 'arquero/dist/types/table/column'
import type {
  MessageRequestSaveToFile,
  MessageRequestFetchData,
  MessageRequestLoadFile,
  MessageResponseFetchData,
  PostMessage,
  MessageRequestUpdateRows,
  MessageRequestInsertRows,
  MessageRequestDeleteRows,
  MessageResponseGetRow,
  MessageRequestGetRow,
  MessageRequestInsertColumns,
  MessageRequestExecuteQueryAndReturnResults,
  MessageResponseExecuteQueryAndReturnResults,
} from './messages'
import { desc, escape, loadJSON, loadCSV, op, from, queryFrom, addFunction, fromJSON } from 'arquero'
import type ColumnTable from 'arquero/dist/types/table/column-table'

let dt: ColumnTable
let tempDt: ColumnTable | undefined

onmessage = async ({ data: { msg, data } }: MessageEvent<PostMessage<unknown>>) => {
  switch (msg) {
    case 'loadFile':
      await loadFile(data as MessageRequestLoadFile)
      break
    case 'getColumnNames':
      getColumnNames()
      break
    case 'fetchData':
      await fetchData(data as MessageRequestFetchData)
      break
    case 'saveToFile':
      await saveToFile(data as MessageRequestSaveToFile)
      break
    case 'updateRows':
      await updateRows(data as MessageRequestUpdateRows)
      break
    case 'insertRows':
      await insertRows(data as MessageRequestInsertRows)
      break
    case 'deleteRows':
      await deleteRows(data as MessageRequestDeleteRows)
      break
    case 'getRow':
      await getRow(data as MessageRequestGetRow)
      break
    case 'insertColumns':
      await insertColumns(data as MessageRequestInsertColumns)
      break
    case 'executeQueryAndReturnResults':
      await executeQueryAndReturnResults(data as MessageRequestExecuteQueryAndReturnResults)
      break
  }
}

async function loadFile(data: MessageRequestLoadFile) {
  tempDt = undefined
  switch (data.extension) {
    case 'csv':
      dt = await loadCSV(data.url, {})
      break
    case 'json':
      dt = await loadJSON(data.url, {})
      break
    default:
      throw new Error(`Unknown extension '${data.extension}'`)
  }

  const message: PostMessage<unknown> = {
    msg: 'loadFile',
    data: undefined,
  }
  postMessage(message)
}

function getColumnNames() {
  const columnNames = dt.columnNames()
  const message: PostMessage<string[]> = {
    msg: 'getColumnNames',
    data: columnNames,
  }
  postMessage(message)
}

async function fetchData(data: MessageRequestFetchData) {
  if (!data.onlyPaginationChanged || !tempDt) {
    tempDt = dt
    //filter
    for (const [column, filter] of [...data.filteredColumns].values()) {
      const lowerCaseFilter = filter?.toString().toLowerCase()
      tempDt = tempDt.filter(escape((d: any) => op.lower(d[column]).includes(lowerCaseFilter)))
      //TODO: test if we can run without escape (better performance)
      //tempDt = tempDt.params({ column, lowerCaseFilter: new RegExp(lowerCaseFilter!) }).filter(d => op.lower(d[column]).match(lowerCaseFilter))
    }
    //sort
    for (const [column, sortDirection] of [...data.sortedColumns].reverse()) {
      //Sort is applied in reverse order !!!
      switch (sortDirection) {
        case 'asc':
          tempDt = tempDt.orderby(column)
          break
        case 'desc':
          tempDt = tempDt.orderby(desc(column))
          break
      }
    }
  }
  //pagination
  const totalRows = tempDt.numRows()
  const objects = tempDt.objects({
    limit: data.pagination.rowsPerPage,
    offset: (data.pagination.currentPage - 1) * data.pagination.rowsPerPage,
  })
  const indices = tempDt
    .indices()
    .slice(
      (data.pagination.currentPage - 1) * data.pagination.rowsPerPage,
      data.pagination.currentPage * data.pagination.rowsPerPage
    )
  const matrix = objects.map(obj => Object.values(obj))

  const message: PostMessage<MessageResponseFetchData> = {
    msg: 'fetchData',
    data: { totalRows, data: matrix, indices: indices },
  }
  postMessage(message)
}

async function saveToFile({ fileHandle, options }: MessageRequestSaveToFile) {
  const extension = fileHandle.name.split('.').pop()
  switch (extension) {
    case 'csv':
      await exportCSV({ fileHandle, options })
      break
    default:
      throw new Error(`Unknown or not yet implemented export file extension: '${extension}'`)
  }
}

async function exportCSV({ fileHandle, options }: MessageRequestSaveToFile) {
  const writable = await fileHandle.createWritable()

  const names: string[] = options?.columns || dt.columnNames()
  //const format = options?.format || {};
  const delim = options?.delimiter || ','
  const reFormat = new RegExp(`["${delim}\n\r]`)
  const bufferRowSize = options?.bufferRowSize || 5000

  const formatValue = (value: any) =>
    value == null
      ? ''
      : value instanceof Date
      ? (value as Date).toISOString()
      : reFormat.test((value += ''))
      ? '"' + value.replace(/"/g, '""') + '"'
      : value

  let buffer = []

  //write the header
  const cells = names.map(formatValue)
  buffer.push(cells.join(delim) + '\n')

  //write the rows
  for (let rowIndex = 0; rowIndex < dt.totalRows(); rowIndex++) {
    if (rowIndex % bufferRowSize == 0) {
      await writable.write(buffer.join(''))
      if (dev) console.log(`DataTable: saved ${rowIndex} rows to file`)
      buffer = []
    }
    const cells = names.map(col => formatValue(dt.get(col, rowIndex)))
    buffer.push(cells.join(delim) + '\n')
  }
  await writable.write(buffer.join(''))
  await writable.close()

  const message: PostMessage<URL> = {
    msg: 'saveToFile',
    data: undefined,
  }
  postMessage(message)
}

function updateRows({ rowsByIndex }: MessageRequestUpdateRows) {
  for (let [index, row] of rowsByIndex) {
    for (const [column, value] of Object.entries(row)) {
      if(dt._data[column] != undefined) dt._data[column].data[index] = value
    }
  }

  const message: PostMessage<unknown> = {
    msg: 'updateRows',
    data: undefined,
  }
  postMessage(message)
}

function insertRows({ rows }: MessageRequestInsertRows) {
  tempDt = undefined

  dt = dt.concat(from(rows))

  const message: PostMessage<unknown> = {
    msg: 'insertRows',
    data: undefined,
  }
  postMessage(message)
}

function deleteRows({ indices }: MessageRequestDeleteRows) {
  tempDt = undefined

  const rowObjects = indices.reduce((acc, cur) => {
    acc.push(dt.object(cur!))
    return acc
  }, [] as Record<string, any>[])

  //TODO: test if we can run without escape (better performance)
  //TODO: use op.equal to handle null values because join semantics do not consider null or undefined values to be equal (that is, null !== null)
  //      or delete based on the index
  //dt = dt.antijoin(from(rowObjects))
  for (const index of indices) {
    for (const column of Object.keys(dt._data)) {
      ;(dt._data[column] as Column).data.splice(index, 1)
    }
    dt._total -= 1
    dt._nrows -= 1
  }

  const message: PostMessage<unknown> = {
    msg: 'deleteRows',
    data: undefined,
  }
  postMessage(message)
}

function getRow({ index }: MessageRequestGetRow) {
  const row = Object.values(dt.object(index))

  const message: PostMessage<MessageResponseGetRow> = {
    msg: 'getRow',
    data: { row },
  }
  postMessage(message)
}

function insertColumns({ columns }: MessageRequestInsertColumns) {
  const obj: {[key: string]: any[]} = {}
  // Add a column that is already in the original table
  obj[dt._names[0]] = [dt._data[dt._names[0]].data[0]]
  for(let col of columns){
    // Add a new column name with an empty array as values
    obj[col.id] = [undefined]
  }
  // Left join the new table into the original table
  dt = dt.join_left(fromJSON(obj))
  const message: PostMessage<unknown> = {
    msg: 'insertColumns',
    data: undefined
   }
  postMessage(message)
}

function executeQueryAndReturnResults({ usedQuery }: MessageRequestExecuteQueryAndReturnResults) {
  const query = queryFrom(usedQuery)
  const queriedData = query.evaluate(dt, () => {}).objects()
  const message: PostMessage<MessageResponseExecuteQueryAndReturnResults> = {
    msg: 'executeQueryAndReturnResults',
    data: { queriedData },
  }
  postMessage(message)
}

export default {}
