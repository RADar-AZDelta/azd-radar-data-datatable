import { dev } from '$app/environment'
import { DataTypeCommonBase } from '$lib/components/datatable/data/DataTypeCommonBase'
import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeFunctionalities,
  IDataTypeInfo,
  IRender,
  SortDirection,
  TFilter,
} from '$lib/components/DataTable'

export class FetchDataTypeClass extends DataTypeCommonBase implements IDataTypeFunctionalities {
  async setData(data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as FetchDataFunc
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
  }

  async setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns) throw new Error('Columns property is not provided')
    else this.internalColumns = columns

    this.internalColumns.forEach(col => {
      if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
    })

    return this.internalColumns
  }

  async render(): Promise<IRender> {
    let start: number
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur) => {
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

  async saveToFile(): Promise<void> {
    if (!this.internalColumns || !this.renderedData) return
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    let csvArrayObjObjects = ''
    let keyCounterArrayOfObjects = 0
    for (let row = 0; row <= this.renderedData.length; row++) {
      for (const col of this.internalColumns) {
        if (row == 0) {
          csvArrayObjObjects += col.id + (keyCounterArrayOfObjects + 1 < this.internalColumns.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        } else {
          const value = (<any[]>this.renderedData)[row - 1][col.id as keyof object].toString().replaceAll(',', ';')
          csvArrayObjObjects += value + (keyCounterArrayOfObjects + 1 < this.internalColumns.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        }
      }
      keyCounterArrayOfObjects = 0
    }
    const writableArrayOfObjects = await fileHandle.createWritable()
    await writableArrayOfObjects.write(csvArrayObjObjects)
    await writableArrayOfObjects.close()
  }

  async replaceValuesOfColumn(): Promise<void> {
    throw new Error('Can not replace values in a column on a function dataset')
  }

  async executeExpressionsAndReturnResults(): Promise<void> {
    throw new Error('Can not execute an expression on a function dataset')
  }

  async executeQueryAndReturnResults(): Promise<void> {
    throw new Error('Can not execute a query on a function dataset')
  }

  async insertColumns(): Promise<void> {
    throw new Error('Can not insert a column on a function dataset')
  }

  async getFullRow(): Promise<void> {
    throw new Error('Can not get a full row on a function dataset')
  }

  async deleteRows(): Promise<void> {
    throw new Error('Can not delete a row on a function dataset')
  }

  async insertRows(): Promise<void> {
    throw new Error('Can not insert a row on a function dataset')
  }

  async updateRows(): Promise<void> {
    throw new Error('Can not update a row on a function dataset')
  }

  async renameColumns(): Promise<void> {
    throw new Error('Can not rename a column on a function dataset')
  }
}
