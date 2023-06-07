//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import { dev } from '$app/environment'
import type {
  PostMessage,
  MessageResponseFetchData,
  MessageRequestLoadFile,
  MessageRequestFetchData,
  MessageRequestSaveToFile,
  MessageRequestUpdateRows,
  MessageRequestInsertRows,
  MessageRequestDeleteRows,
  MessageRequestGetRow,
  MessageResponseGetRow,
  MessageRequestInsertColumns,
  MessageResponseExecuteQueryAndReturnResults,
  MessageRequestExecuteQueryAndReturnResults,
  MessageRespnseInsertColumns,
  MessageResponseExecuteExpressionsAndReturnResults,
  MessageRequestExecuteExpressionsAndReturnResults,
  MessageRequestReplaceValuesOfColumn,
  MessageRequestRenameColumns,
} from '$lib/workers/messages'
import type { IColumnMetaData, IPagination, SortDirection, TFilter } from './DataTable'
import type Query from 'arquero/dist/types/query/query'

export class DataTableWorker {
  private worker: Worker | undefined

  constructor() {}

  async init() {
    const DataTableWorker = await import('$lib/workers/DataTable.worker?worker')
    this.worker = new DataTableWorker.default()
  }

  destroy() {
    this.worker?.terminate()
  }

  private async executeWorkerMethod<TData, TResult>(requestMsg: string, data?: TData): Promise<TResult> {
    let start: number
    if (dev) start = performance.now()
    const result = await new Promise<TResult>((resolve, reject) => {
      this.worker!.onmessage = ({ data: { msg: responseMsg, data } }: MessageEvent<PostMessage<TResult>>) => {
        if (responseMsg === requestMsg) resolve(data as TResult)
      }
      this.worker!.postMessage({ msg: requestMsg, data })
    })
    if (dev) {
      const end = performance.now()
      console.log(`DataTable: worker message '${requestMsg}' took ${Math.round(end - start!)} ms`)
    }
    return result
  }

  async loadFile(url: string, extension: string): Promise<void> {
    await this.executeWorkerMethod<MessageRequestLoadFile, undefined>('loadFile', { url, extension })
  }

  async getColumnNames(): Promise<string[]> {
    return await this.executeWorkerMethod<unknown, string[]>('getColumnNames')
  }

  async fetchData(
    filteredColumns: Map<string, TFilter>,
    sortedColumns: Map<string, SortDirection>,
    pagination: IPagination,
    onlyPaginationChanged: boolean
  ): Promise<{ totalRows: number; data: any[][]; indices: Uint32Array }> {
    return await this.executeWorkerMethod<MessageRequestFetchData, MessageResponseFetchData>('fetchData', {
      filteredColumns,
      sortedColumns,
      pagination,
      onlyPaginationChanged,
    })
  }

  async saveToFile(fileHandle: FileSystemFileHandle, options?: any): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestSaveToFile, void>('saveToFile', { fileHandle, options })
  }

  async updateRows(rowsByIndex: Map<number, Record<string, any>>): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestUpdateRows, void>('updateRows', { rowsByIndex })
  }

  async insertRows(rows: Record<string, any>[]): Promise<MessageRespnseInsertColumns> {
    return await this.executeWorkerMethod<MessageRequestInsertRows, MessageRespnseInsertColumns>('insertRows', { rows })
  }

  async deleteRows(indices: number[]): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestDeleteRows, void>('deleteRows', { indices })
  }

  async getRow(index: number): Promise<MessageResponseGetRow> {
    return await this.executeWorkerMethod<MessageRequestGetRow, MessageResponseGetRow>('getRow', { index })
  }

  async insertColumns(columns: IColumnMetaData[]): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestInsertColumns, void>('insertColumns', { columns })
  }
  async executeQueryAndReturnResults(usedQuery: Query | object, filteredColumns: Map<string, TFilter>, sortedColumns: Map<string, SortDirection>): Promise<MessageResponseExecuteQueryAndReturnResults> {
    return await this.executeWorkerMethod<
      MessageRequestExecuteQueryAndReturnResults,
      MessageResponseExecuteQueryAndReturnResults
    >('executeQueryAndReturnResults', {
      usedQuery,
      filteredColumns,
      sortedColumns
    })
  }

  async executeExpressionsAndReturnResults(
    expressions: Record<string, any>
  ): Promise<MessageResponseExecuteExpressionsAndReturnResults> {
    return await this.executeWorkerMethod<
      MessageRequestExecuteExpressionsAndReturnResults,
      MessageResponseExecuteExpressionsAndReturnResults
    >('executeExpressionsAndReturnResults', {
      expressions,
    })
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestReplaceValuesOfColumn, void>('replaceValuesOfColumn', {
      currentValue,
      updatedValue,
      column,
    })
  }

  async renameColumns(columns: Record<string, string>): Promise<void> {
    return await this.executeWorkerMethod<MessageRequestRenameColumns, void>('renameColumns', { columns })
  }
}
