//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import { expose } from 'comlink'
import { desc, escape, loadJSON, loadCSV, op, from, queryFrom, fromJSON, not } from 'arquero'
import type Column from 'arquero/dist/types/table/column'
import type ColumnTable from 'arquero/dist/types/table/column-table'
import type { TableData } from 'arquero/dist/types/table/table'
import type {
  MessageRequestSaveToFile,
  MessageRequestFetchData,
  MessageRequestLoadFile,
  MessageRequestUpdateRows,
  MessageRequestInsertRows,
  MessageRequestDeleteRows,
  MessageRequestGetRow,
  MessageRequestInsertColumns,
  MessageRequestExecuteQueryAndReturnResults,
  MessageRequestExecuteExpressionsAndReturnResults,
  MessageRequestReplaceValuesOfColumn,
  MessageRequestRenameColumns,
  MessageRequestGetBlob,
  MessageRequestChangeRow,
} from './messages'

let dt: ColumnTable
let tempDt: ColumnTable | undefined

async function loadFile(data: MessageRequestLoadFile) {
  tempDt = undefined
  if (data.extension === 'csv') dt = await loadCSV(data.url, {})
  else if (data.extension === 'json') dt = await loadJSON(data.url, {})
  else throw new Error(`Unknown extension '${data.extension}'`)
}

const getColumnNames = () => dt.columnNames()

async function fetchData(data: MessageRequestFetchData) {
  if (!data.onlyPaginationChanged || !tempDt) {
    tempDt = dt
    //filter
    if (data.filteredColumns.size === 1 && [...data.filteredColumns.keys()][0] === 'all') {
      const filter = [...data.filteredColumns.values()][0]
      const lowerCaseFilter = filter?.toString().toLowerCase()
      const columns = tempDt.columnNames()
      tempDt = tempDt.filter(
        escape((d: any) => {
          let expr
          for (const column of columns) {
            if (!expr) {
              if (op.lower(d[column])) expr = op.lower(d[column]).includes(lowerCaseFilter)
            } else {
              if (op.lower(d[column])) expr = expr || op.lower(d[column]).includes(lowerCaseFilter)
            }
          }
          return expr
        })
      )
    } else {
      for (const [column, filter] of [...data.filteredColumns.entries()]) {
        const lowerCaseFilter = filter?.toString().toLowerCase()
        if (lowerCaseFilter) {
          const reg = new RegExp(lowerCaseFilter)
          if (!tempDt) return
          tempDt = tempDt
            .params({ lowerCaseFilter: lowerCaseFilter, column: column, reg })
            .filter((r: any, params: any) => op.match(op.lower(r[params.column]), params.reg, 0))
        }
      }
    }
    if (!tempDt) return
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
  let totalRows = 0,
    matrix: any[][] = [],
    indices: any = []
  if (tempDt) {
    totalRows = tempDt.numRows()
    const objects = tempDt.objects({
      limit: data.pagination.rowsPerPage,
      offset: (data.pagination.currentPage! - 1) * data.pagination.rowsPerPage!,
    })
    indices = tempDt
      .indices()
      .slice(
        (data.pagination.currentPage! - 1) * data.pagination.rowsPerPage!,
        data.pagination.currentPage! * data.pagination.rowsPerPage!
      )
    matrix = objects.map(obj => Object.values(obj))
  }

  return { totalRows, data: matrix, indices }
}

async function saveToFile({ fileHandle, options }: MessageRequestSaveToFile) {
  const extension = fileHandle.name.split('.').pop()
  if (extension === 'csv') return await exportCSV({ fileHandle, options })
  throw new Error(`Unknown or not yet implemented export file extension: '${extension}'`)
}

async function getBlob({ extension, options }: MessageRequestGetBlob) {
  if (extension === 'csv') return await createBlobCSV(options)
  throw new Error(`Unknown or not yet implemented export file extension: '${extension}'`)
}

async function exportCSV({ fileHandle, options }: MessageRequestSaveToFile) {
  const writable = await fileHandle.createWritable()
  const names: string[] = options?.columns || dt.columnNames()
  const delim = options?.delimiter || ','
  const reFormat = new RegExp(`["${delim}\n\r]`)
  const bufferRowSize = options?.bufferRowSize || 5000
  const formatValue = (value: any) => {
    if (!value) return ''
    else if (value instanceof Date) return value.toISOString()
    else if (reFormat.test((value += ''))) return '"' + value.replace(/"/g, '""') + '"'
    return value
  }
  let buffer = []

  //write the header
  const cells = names.map(formatValue)
  buffer.push(cells.join(delim) + '\n')

  //write the rows
  for (let rowIndex = 0; rowIndex < dt.totalRows(); rowIndex++) {
    if (rowIndex % bufferRowSize == 0) {
      await writable.write(buffer.join(''))
      buffer = []
    }
    const cells = names.map(col => formatValue(dt.get(col, rowIndex)))
    buffer.push(cells.join(delim) + '\n')
  }
  await writable.write(buffer.join(''))
  await writable.close()
}

async function createBlobCSV(options?: any) {
  const names: string[] = options?.columns || dt.columnNames()
  const delim = options?.delimiter || ','
  const reFormat = new RegExp(`["${delim}\n\r]`)
  const formatValue = (value: any) => {
    if (!value) return ''
    else if (value instanceof Date) return value.toISOString()
    else if (reFormat.test((value += ''))) return '"' + value.replace(/"/g, '""') + '"'
    return value
  }
  const buffer = []

  //write the header
  const cells = names.map(formatValue)
  buffer.push(cells.join(delim) + '\n')

  //write the rows
  for (let rowIndex = 0; rowIndex < dt.totalRows(); rowIndex++) {
    const cells = names.map(col => formatValue(dt.get(col, rowIndex)))
    buffer.push(cells.join(delim) + '\n')
  }

  return buffer
}

async function updateRows({ rowsByIndex }: MessageRequestUpdateRows) {
  for (const [index, row] of rowsByIndex)
    for (const [column, value] of Object.entries(row)) if (dt._data[column]) dt._data[column].data[index] = value
}

async function insertRows({ rows }: MessageRequestInsertRows) {
  tempDt = undefined
  const indices: number[] = Array.from({ length: rows.length }, (_, i) => dt._total + i)
  dt = dt.concat(from(rows))
  return indices
}

async function deleteRows({ indices }: MessageRequestDeleteRows) {
  tempDt = undefined

  indices.sort((a, b) => b - a) //sort descending

  for (const index of indices) {
    for (const column of Object.keys(dt._data)) {
      ;(dt._data[column] as Column).data.splice(index, 1)
    }
    dt._total -= 1
    dt._nrows -= 1
  }
}

const getRow = ({ index }: MessageRequestGetRow) => dt.object(index)

async function getNextRow({ index, rowsPerPage, currentPage }: MessageRequestChangeRow) {
  if (!tempDt) return
  const currentIndicesIndex = tempDt._index.indexOf(index)
  const indicesIndex = currentIndicesIndex + 1
  let newPage: number = currentPage
  if (indicesIndex % rowsPerPage === 0) newPage++
  const row = tempDt?.object(indicesIndex)
  return { row, index: indicesIndex, page: newPage }
}

async function getPreviousRow({ index, rowsPerPage, currentPage }: MessageRequestChangeRow) {
  if (!tempDt) return
  const currentIndicesIndex = tempDt._index.indexOf(index)
  const indicesIndex = currentIndicesIndex - 1
  let newPage: number = currentPage
  if ((indicesIndex + 1) % rowsPerPage === 0) newPage--
  const row = tempDt?.object(indicesIndex)
  return { row, index: indicesIndex, page: newPage }
}

async function insertColumns({ columns }: MessageRequestInsertColumns) {
  const obj: Record<string, any> = {}
  // Add a column that is already in the original table
  obj[dt._names[0]] = [dt._data[dt._names[0]].data[0]]
  // Add a new column name with an empty array as values in every row
  for (const col of columns) obj[col.id] = [undefined]
  // Left join the new table into the original table
  dt = dt.join_left(fromJSON(obj))
}

function executeQueryAndReturnResults({
  usedQuery,
  filteredColumns,
  sortedColumns,
}: MessageRequestExecuteQueryAndReturnResults) {
  let tempDt = dt
  for (const [column, filter] of [...filteredColumns].values()) {
    const lowerCaseFilter = filter?.toString().toLowerCase()
    tempDt = tempDt.filter(
      escape((d: any) => {
        if (op.lower(d[column]) && op.lower(d[column])?.includes(lowerCaseFilter)) return d[column]
      })
    )
  }
  for (const [column, sortDirection] of [...sortedColumns].reverse()) {
    if (sortDirection === 'asc') tempDt = tempDt.orderby(column)
    else if (sortDirection === 'desc') tempDt = tempDt.orderby(desc(column))
  }
  const query = queryFrom(usedQuery)
  const queriedDt: ColumnTable = query.evaluate(tempDt, () => {
    return
  })
  const queriedData = queriedDt.objects()

  const columns: Record<string, any> = {}
  queriedDt._names.forEach(col => (columns[col] = () => 0))
  const imputedDt = tempDt.impute(columns)
  const tempQueriedDt = queriedDt.impute(columns)
  const indices = imputedDt.semijoin(tempQueriedDt).indices()

  return { queriedData, indices }
}

function executeExpressionsAndReturnResults({ expressions }: MessageRequestExecuteExpressionsAndReturnResults) {
  const expressionData: any[] = []
  for (const expr of Object.keys(expressions)) expressionData.push(dt.rollup({ [expr]: expressions[expr] }).object())
  return { expressionData }
}

async function replaceValuesOfColumn({ currentValue, updatedValue, column }: MessageRequestReplaceValuesOfColumn) {
  dt.scan((row?: number | undefined, data?: TableData | undefined) => {
    if (data && row) {
      const value = (<Record<string, any>>data)[column].data[row]
      if (value === currentValue) (<Record<string, any>>data)[column].data[row] = updatedValue
    }
  })
}

async function renameColumns({ columns }: MessageRequestRenameColumns) {
  const remove: string[] = []
  for (const [oldCol, newCol] of Object.entries(columns)) if (dt._names.includes(oldCol)) remove.push(newCol)
  dt = dt.select(not(remove), columns)
}

const exposed = {
  loadFile,
  getColumnNames,
  fetchData,
  saveToFile,
  getBlob,
  updateRows,
  insertRows,
  deleteRows,
  getRow,
  getNextRow,
  getPreviousRow,
  insertColumns,
  executeQueryAndReturnResults,
  executeExpressionsAndReturnResults,
  replaceValuesOfColumn,
  renameColumns,
}

expose(exposed)
