import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeFunctionalities,
  IRender,
  ITableOptions,
  ModifyColumnMetadataFunc,
  SortDirection,
  TFilter,
} from '$lib/components/DataTable'
import { DataTableWorker } from '$lib/components/DataTableWorker'
import type Query from 'arquero/dist/types/query/query'

export class dataTypeFile implements IDataTypeFunctionalities {
  worker: DataTableWorker | undefined
  data: File | undefined
  modifyColumnMetaData: ModifyColumnMetadataFunc | undefined
  renderedData: any[] | any[][] | undefined
  internalColumns: IColumnMetaData[] | undefined
  internalOptions: ITableOptions | undefined
  saveOptions = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
  }
  setupDone: boolean

  constructor() {
    this.setupDone = false
    this.data = undefined
    this.modifyColumnMetaData = undefined
    this.renderedData = undefined
    this.internalColumns = undefined
    this.internalOptions = undefined
  }

  setData = async (data: {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
    modifyColumnMetadata?: ModifyColumnMetadataFunc
  }): Promise<void> => {
    if (data.data) this.data = data.data as File
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    this.modifyColumnMetaData = data.modifyColumnMetadata
    if (!this.setupDone) await this.setup()
  }

  setInternalColumns = async (columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> => {
    if (this.worker) {
      if (!columns) {
        //get columns from worker
        this.internalColumns = (await this.worker!.getColumnNames()).map((key, index) => ({
          id: key,
          position: index + 1,
        }))
        if (this.modifyColumnMetaData) {
          const internalColumnsCopy = this.internalColumns.map(col => col.id)
          this.internalColumns = this.modifyColumnMetaData(this.internalColumns)
          const addedColumns = this.internalColumns.map(col => col.id).filter(x => !internalColumnsCopy.includes(x))
          if (addedColumns.length > 0)
            await this.worker?.insertColumns(
              this.internalColumns.reduce<IColumnMetaData[]>((acc, cur) => {
                if (addedColumns.includes(cur.id)) acc.push(cur)
                return acc
              }, [])
            )
        }
      } else this.internalColumns = columns

      this.internalColumns.forEach(col => {
        if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
      })

      return this.internalColumns
    }

    throw new Error('TEST ERROR')
  }

  setup = async (): Promise<void> => {
    if (this.data) {
      const url = URL.createObjectURL(this.data)
      this.worker = new DataTableWorker()
      await this.worker.init()
      const extension = this.data!.name.split('.').pop()
      await this.worker!.loadFile(url, extension!)
      URL.revokeObjectURL(url)
      this.setupDone = true
    }
  }

  render = async (onlyPaginationChanged: boolean): Promise<IRender> => {
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
    const results = await this.worker?.fetchData(
      filteredColumns,
      sortedColumns,
      this.internalOptions!,
      onlyPaginationChanged
    )
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

  saveToFile = async (): Promise<void> => {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    await this.worker!.saveToFile(fileHandle)
  }

  replaceValuesOfColumn = async (currentValue: any, updatedValue: any, column: string): Promise<void> => {
    await this.worker!.replaceValuesOfColumn(currentValue, updatedValue, column)
  }

  executeExpressionsAndReturnResults = async (expressions: Record<string, any>): Promise<any> => {
    return await this.worker!.executeExpressionsAndReturnResults(expressions)
  }

  executeQueryAndReturnResults = async (query: Query | object): Promise<any> => {
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    const res = await this.worker!.executeQueryAndReturnResults(query, filteredColumns, sortedColumns)
    
    return res
  }

  insertColumns = async (cols: IColumnMetaData[]): Promise<IColumnMetaData[]> => {
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
    await this.worker!.insertColumns(uniqueColumns)
    this.internalColumns = this.internalColumns!.concat(uniqueColumns)

    return this.internalColumns
  }

  getFullRow = async (originalIndex: number): Promise<Record<string, any>> => {
    const row = (await this.worker!.getRow(originalIndex)).row
    return this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id!] = row[idx]
      return acc
    }, {} as Record<string, any>)
  }

  deleteRows = async (originalIndices: number[]): Promise<void> => {
    await this.worker!.deleteRows(originalIndices)
  }

  insertRows = async (rows: Record<string, any>[]): Promise<number[]> => {
    const originalIndices = (await this.worker!.insertRows(rows)).indices

    return originalIndices
  }

  updateRows = async (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> => {
    const rowsToUpdateByWorkerIndex = [...rowsToUpdateByOriginalIndex].reduce<Map<number, Record<string, any>>>(
      (acc, [originalIndex, row]) => {
        acc.set(originalIndex, row) //swap the local index with the worker index
        return acc
      },
      new Map<number, Record<string, any>>()
    )
    await this.worker!.updateRows(rowsToUpdateByWorkerIndex)
  }

  renameColumns = async (columns: Record<string, string>): Promise<void> => {
    await this.worker!.renameColumns(columns)
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
}
