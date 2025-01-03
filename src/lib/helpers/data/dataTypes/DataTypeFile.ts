import { detect } from 'jschardet'
import { proxy, wrap, type Remote } from 'comlink'
import Reader from '../../FileReader'
import DataTableWorker from '../../../workers/DataTable.worker?worker'
import { DataTypeCommonBase } from '../../../helpers/data/dataTypes/DataTypeCommonBase'
import type {
  IColumnMetaData,
  IDataTypeFunctionalities,
  IDataTypeInfo,
  IRender,
  IRowNavigation,
  ITableFilter,
  ModifyColumnMetadataFunc,
  SortDirection,
  TFilter,
} from '../../../interfaces/Types'

export class DataTypeFile extends DataTypeCommonBase implements IDataTypeFunctionalities {
  worker: Worker
  exposed: Remote<any>
  modifyColumnMetaData: ModifyColumnMetadataFunc | undefined
  setup: boolean | undefined

  constructor() {
    super()
    this.worker = new DataTableWorker()
    this.exposed = wrap(this.worker)
  }

  async setData(data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as File
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    this.modifyColumnMetaData = data.modifyColumnMetadata
    const url = URL.createObjectURL(this.data as File)
    const extension = (this.data as File)!.name.split('.').pop()!
    await this.exposed.loadFile({ url, extension })
    this.setup = true
    URL.revokeObjectURL(url)
  }

  async setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if ((!columns || !columns.length) && this.setup) {
      //get columns from worker
      const receivedCols: string[] = await this.exposed.getColumnNames()
      this.internalColumns = receivedCols.map((key, index) => ({ id: key, position: index + 1 }))
      if (this.modifyColumnMetaData && this.internalColumns) {
        const internalColumnsCopy = this.internalColumns.map(col => col.id)
        this.internalColumns = this.modifyColumnMetaData(this.internalColumns)
        const addedColumns = this.internalColumns.map(col => col.id).filter(x => !internalColumnsCopy.includes(x))
        if (addedColumns.length) {
          const addedCols = this.internalColumns.reduce<IColumnMetaData[]>((acc, cur) => {
            if (addedColumns.includes(cur.id)) acc.push(cur)
            return acc
          }, [])
          await this.exposed.insertColumns({ columns: addedCols })
        }
      }
    } else this.internalColumns = columns

    if (this.internalOptions && this.internalColumns) {
      this.internalColumns.forEach(col => {
        if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
      })
    }

    return this.internalColumns as IColumnMetaData[]
  }

  async render(onlyPaginationChanged: boolean): Promise<IRender> {
    const filteredColumns: Map<string, TFilter> = await this.getFilteredColumns()
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const pagination = { rowsPerPage: this.internalOptions?.rowsPerPage, currentPage: this.internalOptions?.currentPage }
    const results = await this.exposed.fetchData({ filteredColumns, sortedColumns, pagination, onlyPaginationChanged })
    const totalRows = results!.totalRows
    this.renderedData = results!.data.map((row: any) =>
      this.internalColumns?.reduce(
        (acc, cur, index) => {
          acc[cur.id!] = row[index]
          return acc
        },
        {} as Record<string, any>,
      ),
    )
    const originalIndices = (<number[]>results.indices).reduce<number[]>((acc, cur) => {
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

  private async getFilteredColumns() {
    const globalFilter = this.internalOptions?.globalFilter
    if (globalFilter?.filter) {
      const { filter, column } = globalFilter
      return new Map<string, TFilter>([[column, filter]])
    } else
      return this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur) => {
        if (cur && cur.filter) acc.set(cur.id, cur.filter)
        return acc
      }, new Map<string, TFilter>())
  }

  async saveToFile(): Promise<void> {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    await this.exposed.saveToFile({ fileHandle })
  }

  async getBlob(): Promise<Blob> {
    const buffer = await this.exposed.getBlob({ extension: 'csv' })
    const blob = new Blob(buffer, { type: 'text/csv' })
    return blob
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    await this.exposed.replaceValuesOfColumn({ currentValue, updatedValue, column })
  }

  async executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any> {
    return await this.exposed.executeExpressionsAndReturnResults({ expressions })
  }

  async executeQueryAndReturnResults(usedQuery: ITableFilter): Promise<any> {
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    return await this.exposed.executeQueryAndReturnResults(proxy({ usedQuery, filteredColumns, sortedColumns }))
  }

  async insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[]> {
    const uniqueColumns: IColumnMetaData[] = []
    for (const col of cols) {
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
    await this.exposed.insertColumns({ columns: uniqueColumns })
    this.internalColumns = this.internalColumns!.concat(uniqueColumns)

    return this.internalColumns
  }

  async getFullRow(originalIndex: number): Promise<Record<string, any>> {
    return await this.exposed.getRow({ index: originalIndex })
  }

  async getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<IRowNavigation> {
    return await this.exposed.getNextRow({ index: currentIndex, rowsPerPage, currentPage })
  }

  async getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<Record<string, any>> {
    return await this.exposed.getPreviousRow({ index: currentIndex, rowsPerPage, currentPage })
  }

  async deleteRows(originalIndices: number[]): Promise<void> {
    await this.exposed.deleteRows({ indices: originalIndices })
  }

  async insertRows(rows: Record<string, any>[]): Promise<number[]> {
    return await this.exposed.insertRows({ rows })
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    const rowsToUpdateByWorkerIndex = [...rowsToUpdateByOriginalIndex].reduce<Map<number, Record<string, any>>>((acc, [originalIndex, row]) => {
      acc.set(originalIndex, row) //swap the local index with the worker index
      return acc
    }, new Map<number, Record<string, any>>())
    await this.exposed.updateRows({ rowsByIndex: rowsToUpdateByWorkerIndex })
  }

  async validate() {
    if (!this.data) return false
    const isValidEncoding = await this.isNotAscii()
    if(!isValidEncoding) return false
    const isValidUTF8 = await this.isUTF8()
    if(isValidUTF8) return false
    return true
  }

  private async isUTF8() {
    const arrayBuffer = await Reader.readFileAsArrayBuffer(this.data as File)
    if (!arrayBuffer) return 
    const view = new Uint8Array(arrayBuffer)
    return view[0] === 0xEF && view[1] === 0xBB && view[2] === 0xBF
  }

  private async isNotAscii() {
    const text = await Reader.readFileAsText(this.data as File)
    if(!text) return
    const encoding = detect(text).encoding
    return encoding !== 'ascii'
  }

  async destroy(): Promise<void> {
    this.worker?.terminate()
  }
}
