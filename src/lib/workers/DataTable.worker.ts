//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
//import { dev } from '$app/environment'
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
  MessageRespnseInsertColumns,
  MessageRequestExecuteExpressionsAndReturnResults,
  MessageResponseExecuteExpressionsAndReturnResults,
  MessageRequestReplaceValuesOfColumn,
} from './messages'
import { desc, escape, loadJSON, loadCSV, op, from, queryFrom, addFunction, fromJSON } from 'arquero'
import type ColumnTable from 'arquero/dist/types/table/column-table'
import type { TableData } from 'arquero/dist/types/table/table'

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
    case 'executeExpressionsAndReturnResults':
      await executeExpressionsAndReturnResults(data as MessageRequestExecuteExpressionsAndReturnResults)
      break
    case 'replaceValuesOfColumn':
      await replaceValuesOfColumn(data as MessageRequestReplaceValuesOfColumn)
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
    if (data.filteredColumns.size === 1 && [...data.filteredColumns.keys()][0] === "all") {
      const filter = [...data.filteredColumns.values()][0]
      const lowerCaseFilter = filter?.toString().toLowerCase()
      const columns = tempDt.columnNames()
      tempDt = tempDt.filter(escape((d: any) => {
        let expr
        for (const column of columns) {
          if (!expr)
            expr = op.lower(d[column]).includes(lowerCaseFilter)
          else
            expr = expr || op.lower(d[column]).includes(lowerCaseFilter)
        }
        return expr
      }))
    } else {
      for (const [column, filter] of [...data.filteredColumns.entries()]) {
        const lowerCaseFilter = filter?.toString().toLowerCase()
        tempDt = tempDt.filter(escape((d: any) => op.lower(d[column]).includes(lowerCaseFilter)))
        //TODO: test if we can run without escape (better performance)
        //tempDt = tempDt.params({ column, lowerCaseFilter: new RegExp(lowerCaseFilter!) }).filter(d => op.lower(d[column]).match(lowerCaseFilter))
      }
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
    offset: (data.pagination.currentPage! - 1) * data.pagination.rowsPerPage!,
  })
  const indices = tempDt
    .indices()
    .slice(
      (data.pagination.currentPage! - 1) * data.pagination.rowsPerPage!,
      data.pagination.currentPage! * data.pagination.rowsPerPage!
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
      //if (dev) console.log(`DataTable: saved ${rowIndex} rows to file`)
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
      if (dt._data[column]) dt._data[column].data[index] = value
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

  const indices: number[] = Array.from({ length: rows.length }, (_, i) => dt._total + i)
  dt = dt.concat(from(rows))

  const message: PostMessage<MessageRespnseInsertColumns> = {
    msg: 'insertRows',
    data: {
      indices,
    },
  }
  postMessage(message)
}

function deleteRows({ indices }: MessageRequestDeleteRows) {
  tempDt = undefined

  indices.sort((a, b) => b - a) //sort descending

  for (const index of indices) {
    for (const column of Object.keys(dt._data)) {
      ; (dt._data[column] as Column).data.splice(index, 1)
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
  const obj: Record<string, any> = {}
  // Add a column that is already in the original table
  obj[dt._names[0]] = [dt._data[dt._names[0]].data[0]]
  for (let col of columns) {
    // Add a new column name with an empty array as values
    obj[col.id] = [undefined]
  }
  // Left join the new table into the original table
  dt = dt.join_left(fromJSON(obj))

  // const existingColumns = Object.keys(dt._data)
  // for (const col of columns) {
  //   if (existingColumns.includes(col.id))
  //     continue
  //   dt._data[col.id].data = new Array(dt._total).fill(null);
  // }
  const message: PostMessage<unknown> = {
    msg: 'insertColumns',
    data: undefined,
  }
  postMessage(message)
}

function executeQueryAndReturnResults({ usedQuery }: MessageRequestExecuteQueryAndReturnResults) {
  const query = queryFrom(usedQuery)
  const queriedDt: ColumnTable = query.evaluate(dt, () => { })
  const queriedData = queriedDt.objects()

  let columns: Record<string, any> = {}
  queriedDt._names.forEach(col => (columns[col] = () => 0))
  const tempDt = dt.impute(columns)
  const tempQueriedDt = queriedDt.impute(columns)
  const indices = tempDt.semijoin(tempQueriedDt).indices()

  const message: PostMessage<MessageResponseExecuteQueryAndReturnResults> = {
    msg: 'executeQueryAndReturnResults',
    data: { queriedData, indices },
  }
  postMessage(message)
}

function executeExpressionsAndReturnResults({ expressions }: MessageRequestExecuteExpressionsAndReturnResults) {
  const expressionData: any[] = []
  for (let expr of Object.keys(expressions)) {
    expressionData.push(dt.rollup({ [expr]: expressions[expr] }).object())
  }
  const message: PostMessage<MessageResponseExecuteExpressionsAndReturnResults> = {
    msg: 'executeExpressionsAndReturnResults',
    data: { expressionData },
  }
  postMessage(message)
}

function replaceValuesOfColumn({ currentValue, updatedValue, column }: MessageRequestReplaceValuesOfColumn) {
  dt.scan((row?: number | undefined, data?: TableData | undefined) => {
    if (data[column as keyof Object].data[row] == currentValue) {
      data![column as keyof Object].data[row] = updatedValue
    }
  })
  const message: PostMessage<unknown> = {
    msg: 'replaceValuesOfColumn',
    data: undefined,
  }
  postMessage(message)
}

export default {}
