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
import DataTableWorker from '$lib/workers/DataTable.worker?worker'
import { DataTypeCommonBase } from './DataTypeCommonBase'
import { wrap, type Remote } from 'comlink'

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
    if (!columns && this.setup) {
      //get columns from worker
      const receivedCols: string[] = await this.exposed.getColumnNames()
      this.internalColumns = receivedCols.map((key, index) => ({ id: key, position: index + 1 }))
      if (this.modifyColumnMetaData && this.internalColumns) {
        const internalColumnsCopy = this.internalColumns.map(col => col.id)
        this.internalColumns = this.modifyColumnMetaData(this.internalColumns)
        const addedColumns = this.internalColumns.map(col => col.id).filter(x => !internalColumnsCopy.includes(x))
        if (addedColumns.length > 0) {
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

    return (this.internalColumns as IColumnMetaData[])
  }

  async render(onlyPaginationChanged: boolean): Promise<IRender> {
    console.log("RENDERING")
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
    const results = await this.exposed.fetchData({
      filteredColumns,
      sortedColumns,
      pagination: { rowsPerPage: this.internalOptions?.rowsPerPage, currentPage: this.internalOptions?.currentPage },
      onlyPaginationChanged,
    })
    console.log('FETCH DATA ', results)
    let totalRows = results!.totalRows
    this.renderedData = results!.data.map((row: any) =>
      this.internalColumns?.reduce((acc, cur, index) => {
        acc[cur.id!] = row[index]
        return acc
      }, {} as Record<string, any>)
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

  async saveToFile(): Promise<void> {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    await this.exposed.saveToFile({ fileHandle })
  }

  async getBlob(): Promise<Blob> {
    const { buffer } = await this.exposed.getBlob({ extension: 'csv' })
    const blob = new Blob(buffer, { type: 'text/csv' })
    return blob
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    await this.exposed.replaceValuesOfColumn({ currentValue, updatedValue, column })
  }

  async executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any> {
    return await this.exposed.executeExpressionsAndReturnResults({ expressions })
  }

  async executeQueryAndReturnResults(query: Query | object): Promise<any> {
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    return await this.exposed.executeQueryAndReturnResults({
      usedQuery: query,
      filteredColumns,
      sortedColumns
    })
  }

  async insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[]> {
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
    await this.exposed.insertColumns({ columns: uniqueColumns })
    this.internalColumns = this.internalColumns!.concat(uniqueColumns)

    return this.internalColumns
  }

  async getFullRow(originalIndex: number): Promise<Record<string, any>> {
    const row = await this.exposed.getRow({ index: originalIndex }).row
    return this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id!] = row[idx]
      return acc
    }, {} as Record<string, any>)
  }

  async deleteRows(originalIndices: number[]): Promise<void> {
    await this.exposed.deleteRows({ indices: originalIndices })
  }

  async insertRows(rows: Record<string, any>[]): Promise<number[]> {
    return await this.exposed.insertRows({ rows }).indices
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    const rowsToUpdateByWorkerIndex = [...rowsToUpdateByOriginalIndex].reduce<Map<number, Record<string, any>>>(
      (acc, [originalIndex, row]) => {
        acc.set(originalIndex, row) //swap the local index with the worker index
        return acc
      },
      new Map<number, Record<string, any>>()
    )
    await this.exposed.updateRows({ rowsByIndex: rowsToUpdateByWorkerIndex })
  }

  async renameColumns(columns: Record<string, string>): Promise<void> {
    await this.exposed.renameColumns({ columns })
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

  async destroy(): Promise<void> {
    this.worker?.terminate()
  }

  async applyFilter(data: any[] | any[][]): Promise<void> { }

  async applySort(data: any[] | any[][]): Promise<void> { }
}
