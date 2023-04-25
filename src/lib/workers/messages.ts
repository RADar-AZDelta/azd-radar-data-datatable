//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import type { IPagination, SortDirection, TFilter } from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'

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

export interface MessageResponseGetRow {
  row: Record<string, any>
}

export interface MessageRequestExecuteQueryAndReturnResults {
  usedQuery: Query | object
}

export interface MessageResponseExecuteQueryAndReturnResults {
  queriedData: any
}
