import { dev } from '$app/environment'
import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeFunctionalities,
  IRender,
  ITableOptions,
  SortDirection,
  TFilter,
} from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'

export class dataTypeFunction implements IDataTypeFunctionalities {
  data: FetchDataFunc | undefined
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

  constructor() {
    this.data = undefined
    this.renderedData = undefined
    this.internalColumns = undefined
    this.internalOptions = undefined
  }

  setData = (data: {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
  }): void => {
    if (data.data) this.data = data.data as FetchDataFunc
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
  }

  setInternalColumns = (columns: IColumnMetaData[] | undefined): IColumnMetaData[] => {
    if (!columns) throw new Error('Columns property is not provided')
    else this.internalColumns = columns

    this.internalColumns.forEach(col => {
      if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
    })

    return this.internalColumns
  }

  render = async (onlyPaginationChanged: boolean): Promise<IRender> => {
    let start: number
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur, i) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur, i) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    if (dev) start = performance.now()
    const results = await (this.data as FetchDataFunc)(filteredColumns, sortedColumns, this.internalOptions!)
    if (dev) {
      const end = performance.now()
      console.log(`DataTable: fetchData function took: ${Math.round(end - start!)} ms`)
    }
    const originalIndices = Array.from({ length: results.data.length }, (_, i) => i)
    const totalRows = results.totalRows
    this.renderedData = results.data

    return {
      originalIndices,
      totalRows,
      renderedData: this.renderedData,
      internalColumns: this.internalColumns,
    }
  }

  saveToFile = async (): Promise<void> => {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    let csvArrayObjObjects = ''
    let keyCounterArrayOfObjects: number = 0
    for (let row = 0; row <= this.renderedData!.length; row++) {
      for (let col of this.internalColumns!) {
        if (row == 0) {
          csvArrayObjObjects += col.id + (keyCounterArrayOfObjects + 1 < this.internalColumns!.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        } else {
          const value = (<any[]>this.renderedData)[row - 1][col.id as keyof object].toString().replaceAll(',', ';')
          csvArrayObjObjects += value + (keyCounterArrayOfObjects + 1 < this.internalColumns!.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        }
      }
      keyCounterArrayOfObjects = 0
    }
    const writableArrayOfObjects = await fileHandle.createWritable()
    await writableArrayOfObjects.write(csvArrayObjObjects)
    await writableArrayOfObjects.close()
  }

  replaceValuesOfColumn = (currentValue: any, updatedValue: any, column: string): void => {
    throw new Error('Can not replace values in a column on a function dataset')
  }

  executeExpressionsAndReturnResults = (expressions: Record<string, any>): void => {
    throw new Error('Can not execute an expression on a function dataset')
  }

  executeQueryAndReturnResults = (query: Query | object): void => {
    throw new Error('Can not execute a query on a function dataset')
  }

  insertColumns = (cols: IColumnMetaData[]): void => {
    throw new Error('Can not insert a column on a function dataset')
  }

  getFullRow = (originalIndex: number): void => {
    throw new Error('Can not get a full row on a function dataset')
  }

  deleteRows = (originalIndices: number[]): void => {
    throw new Error('Can not delete a row on a function dataset')
  }

  insertRows = (rows: Record<string, any>[]): void => {
    throw new Error('Can not insert a row on a function dataset')
  }

  updateRows = (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): void => {
    throw new Error('Can not update a row on a function dataset')
  }

  renameColumns = (columns: Record<string, string>): void => {
    throw new Error('Can not rename a column on a function dataset')
  }
}
