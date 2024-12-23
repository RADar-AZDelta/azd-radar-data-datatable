//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import type { IColumnMetaData, IPagination, ITableFilter, SortDirection, TFilter } from '../interfaces/Types'

export interface PostMessage<TData> {
  msg: string
  data?: TData
}
export interface MessageRequestLoadFile {
  url: string
  extension: string
}
export interface MessageRequestFetchData {
  filteredColumns: Map<string, TFilter>
  sortedColumns: Map<string, SortDirection>
  pagination: IPagination
  onlyPaginationChanged: boolean
}

export interface MessageResponseFetchData {
  totalRows: number
  data: any[][]
  indices: Uint32Array
}
export interface MessageRequestSaveToFile {
  fileHandle: FileSystemFileHandle
  options?: any
}

export interface MessageRequestGetBlob {
  extension: string
  options?: any
}

export interface MessageResponseGetBlob {
  buffer: any[]
}

export interface MessageRequestUpdateRows {
  rowsByIndex: Map<number, Record<string, any>>
}

export interface MessageRequestInsertRows {
  rows: Record<string, any>[]
}

export interface MessageRequestDeleteRows {
  indices: number[]
}

export interface MessageRequestGetRow {
  index: number
}

export interface MessageRequestChangeRow {
  index: number
  rowsPerPage: number
  currentPage: number
}

export interface MessageResponseGetRow {
  row: Record<string, any>
}

export interface MessageRequestInsertColumns {
  columns: IColumnMetaData[]
}

export interface MessageRespnseInsertColumns {
  indices: number[]
}

export interface MessageRequestExecuteQueryAndReturnResults {
  usedQuery: ITableFilter
  filteredColumns: Map<string, TFilter>
  sortedColumns: Map<string, SortDirection>
}

export interface MessageResponseExecuteQueryAndReturnResults {
  queriedData: any
  indices: Uint32Array
}

export interface MessageRequestExecuteExpressionsAndReturnResults {
  expressions: Record<string, any>
}

export interface MessageResponseExecuteExpressionsAndReturnResults {
  expressionData: any
}

export interface MessageRequestReplaceValuesOfColumn {
  currentValue: any
  updatedValue: any
  column: string
}

export interface MessageRequestRenameColumns {
  columns: Record<string, string>
}
