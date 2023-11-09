import type {
  IColumnMetaData,
  IDataTypeFunctionalities,
  IDataTypeInfo,
  IRender,
  ModifyColumnMetadataFunc,
  SortDirection,
  TFilter,
} from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'
import { dev } from '$app/environment'
import type { MessageRequestLoadFile, MessageRequestInsertColumns, MessageRequestFetchData, MessageResponseFetchData, MessageRequestSaveToFile, MessageRequestGetBlob, MessageResponseGetBlob, MessageRequestReplaceValuesOfColumn, MessageRequestExecuteExpressionsAndReturnResults, MessageResponseExecuteExpressionsAndReturnResults, MessageRequestExecuteQueryAndReturnResults, MessageResponseExecuteQueryAndReturnResults, MessageRequestGetRow, MessageResponseGetRow, MessageRequestDeleteRows, MessageRequestInsertRows, MessageRespnseInsertColumns, MessageRequestUpdateRows, MessageRequestRenameColumns, PostMessage } from '$lib/workers/messages'
import DataTableWorker from '$lib/workers/DataTable.worker?worker'
import { DataTypeCommonBase } from './DataTypeCommonBase'

export class DataTypeFile extends DataTypeCommonBase implements IDataTypeFunctionalities {
  worker: Worker | undefined
  modifyColumnMetaData: ModifyColumnMetadataFunc | undefined
  setup: boolean | undefined

  constructor() {
    super()

    this.worker = new DataTableWorker()
  }

  async setData (data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as File
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    this.modifyColumnMetaData = data.modifyColumnMetadata
    if(this.worker) {
      const url = URL.createObjectURL(this.data as File)
      const extension = (this.data as File)!.name.split('.').pop()!
      await this.executeWorkerMethod<MessageRequestLoadFile, undefined>('loadFile', { url, extension }).then(() => this.setup = true)
      URL.revokeObjectURL(url)
    }
  }

  async setInternalColumns (columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
      if (!columns && this.setup) {
        //get columns from worker
        this.internalColumns = (await this.executeWorkerMethod<unknown, string[]>('getColumnNames')).map((key, index) => ({
          id: key,
          position: index + 1,
        }))
        if (this.modifyColumnMetaData) {
          const internalColumnsCopy = this.internalColumns.map(col => col.id)
          this.internalColumns = this.modifyColumnMetaData(this.internalColumns)
          const addedColumns = this.internalColumns.map(col => col.id).filter(x => !internalColumnsCopy.includes(x))
          if (addedColumns.length > 0){
            const addedCols = this.internalColumns.reduce<IColumnMetaData[]>((acc, cur) => {
              if (addedColumns.includes(cur.id)) acc.push(cur)
              return acc
            }, [])
            await this.executeWorkerMethod<MessageRequestInsertColumns, void>('insertColumns', { columns: addedCols })

          }
        }
      } else this.internalColumns = columns

      if(this.internalOptions && this.internalColumns){
        this.internalColumns.forEach(col => {
          if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
        })
      }
    
    return (this.internalColumns as IColumnMetaData[])
  }

  async render (onlyPaginationChanged: boolean): Promise<IRender> {
    const filteredColumns = this.internalOptions?.globalFilter?.filter
      ? new Map<string, TFilter>([
          [this.internalOptions!.globalFilter!.column, this.internalOptions!.globalFilter!.filter],
        ])
      : this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
          if (cur && cur.filter) acc.set(cur.id, cur.filter)
          return acc
        }, new Map<string, TFilter>())
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const results = await this.executeWorkerMethod<MessageRequestFetchData, MessageResponseFetchData>('fetchData', {
      filteredColumns,
      sortedColumns,
      pagination: { rowsPerPage: this.internalOptions?.rowsPerPage, currentPage: this.internalOptions?.currentPage},
      onlyPaginationChanged,
    })
    let totalRows = results!.totalRows
    this.renderedData = results!.data.map(row =>
      this.internalColumns?.reduce((acc, cur, index) => {
        acc[cur.id!] = row[index]
        return acc
      }, {} as Record<string, any>)
    )
    const originalIndices = results!.indices.reduce<number[]>((acc, cur) => {
      acc.push(cur)
      return acc
    }, [])

    return {
      originalIndices,
      totalRows,
      renderedData: this.renderedData,
      internalColumns: this.internalColumns,
    }
  }

  async saveToFile (): Promise<void> {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    await this.executeWorkerMethod<MessageRequestSaveToFile, void>('saveToFile', { fileHandle })
  }

  async getBlob (): Promise<Blob> {
    const { buffer } = await this.executeWorkerMethod<MessageRequestGetBlob, MessageResponseGetBlob>('getBlob', { extension: 'csv' })
    const blob = new Blob(buffer, { type: 'text/csv'})
    return blob
  }

  async replaceValuesOfColumn (currentValue: any, updatedValue: any, column: string): Promise<void> {
    await this.executeWorkerMethod<MessageRequestReplaceValuesOfColumn, void>('replaceValuesOfColumn', {
      currentValue,
      updatedValue,
      column,
    })
  }

  async executeExpressionsAndReturnResults (expressions: Record<string, any>): Promise<any> {
    return await this.executeWorkerMethod<
    MessageRequestExecuteExpressionsAndReturnResults,
    MessageResponseExecuteExpressionsAndReturnResults
  >('executeExpressionsAndReturnResults', {
    expressions,
  })  }

  async executeQueryAndReturnResults (query: Query | object): Promise<any> {
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    const res = await this.executeWorkerMethod<
    MessageRequestExecuteQueryAndReturnResults,
    MessageResponseExecuteQueryAndReturnResults
  >('executeQueryAndReturnResults', {
    usedQuery: query,
    filteredColumns,
    sortedColumns
  })
    
    return res
  }

  async insertColumns (cols: IColumnMetaData[]): Promise<IColumnMetaData[]> {
    let uniqueColumns: IColumnMetaData[] = []
    for (let col of cols) {
      if (this.internalColumns!.find(c => c.id === col.id)) console.error(`Column with id ${col.id} already exists`)
      else {
        if (!col.position)
          col.position =
            this.internalColumns!.reduce<number>((acc, cur) => {
              if (cur.position! > acc) return cur.position!
              else return acc
            }, 0) + 1 //add new column at end (with last position)
        uniqueColumns.push(col)
      }
    }
    await this.executeWorkerMethod<MessageRequestInsertColumns, void>('insertColumns', { columns: uniqueColumns })
    this.internalColumns = this.internalColumns!.concat(uniqueColumns)

    return this.internalColumns
  }

  async getFullRow (originalIndex: number): Promise<Record<string, any>> {
    const row = (await this.executeWorkerMethod<MessageRequestGetRow, MessageResponseGetRow>('getRow', { index: originalIndex })).row
    return this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id!] = row[idx]
      return acc
    }, {} as Record<string, any>)
  }

  async deleteRows (originalIndices: number[]): Promise<void> {
    await this.executeWorkerMethod<MessageRequestDeleteRows, void>('deleteRows', { indices: originalIndices })
  }

  async insertRows (rows: Record<string, any>[]): Promise<number[]> {
    const originalIndices = (await this.executeWorkerMethod<MessageRequestInsertRows, MessageRespnseInsertColumns>('insertRows', { rows })).indices

    return originalIndices
  }

  async updateRows (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    const rowsToUpdateByWorkerIndex = [...rowsToUpdateByOriginalIndex].reduce<Map<number, Record<string, any>>>(
      (acc, [originalIndex, row]) => {
        acc.set(originalIndex, row) //swap the local index with the worker index
        return acc
      },
      new Map<number, Record<string, any>>()
    )
    await this.executeWorkerMethod<MessageRequestUpdateRows, void>('updateRows', { rowsByIndex: rowsToUpdateByWorkerIndex })
  }

  async renameColumns (columns: Record<string, string>): Promise<void> {
    await this.executeWorkerMethod<MessageRequestRenameColumns, void>('renameColumns', { columns })
    for (let [oldCol, newCol] of Object.entries(columns)) {
      if (this.internalColumns!.find(col => col.id === newCol)) {
        const oldIndex = this.internalColumns!.findIndex(col => col.id === oldCol)
        const newIndex = this.internalColumns!.findIndex(col => col.id === newCol)
        this.internalColumns!.splice(newIndex, 1)
        let { id, ...col } = this.internalColumns![newIndex]
        this.internalColumns![oldIndex] = Object.assign(col, { id: newCol })
      } else {
        this.internalColumns!.find(col => col.id === oldCol)!.id = newCol
      }
    }
  }

  private async executeWorkerMethod<TData, TResult>(requestMsg: string, data?: TData): Promise<TResult> {
    let start: number
    if (dev) start = performance.now()
    const result = await new Promise<TResult>((resolve, reject) => {
      this.worker!.onmessage = ({ data: { msg: responseMsg, data } }: MessageEvent<PostMessage<TResult>>) => {
        resolve(data as TResult)
      }
      this.worker!.postMessage({ msg: requestMsg, data })
    })
    if (dev) {
      const end = performance.now()
    }
    return result
  }

  async destroy(): Promise<void> {
    this.worker?.terminate()
  }

  async applyFilter(data: any[] | any[][]): Promise<void> {}

  async applySort(data: any[] | any[][]): Promise<void> {}
}
