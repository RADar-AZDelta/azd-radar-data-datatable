import { isDev, logWhenDev } from '@dtlib/utils'
import { DataTypeCommonBase } from '@dtlib/helpers/data/dataTypes/DataTypeCommonBase'
import type { FetchDataFunc, IColumnMetaData, IDataTypeFunctionalities, IDataTypeInfo, IRender, SortDirection, TFilter } from '@dtlib/interfaces/Types'

export class FetchDataTypeClass extends DataTypeCommonBase implements IDataTypeFunctionalities {
  async setData(data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as FetchDataFunc
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
  }

  async setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns || !columns.length) throw new Error('Columns property is not provided')
    this.internalColumns = columns
    for (const col of this.internalColumns) if (!col.width) col.width = this.internalOptions?.defaultColumnWidth ?? 10
    return this.internalColumns
  }

  async render(): Promise<IRender> {
    let start: number, end: number
    if (isDev()) start = performance.now()
    const filteredColumns = this.internalColumns!.reduce<Map<string, TFilter>>((acc, cur) => {
      if (cur && cur.filter) acc.set(cur.id, cur.filter)
      return acc
    }, new Map<string, TFilter>())
    const sortedColumns = this.internalColumns!.reduce<Map<string, SortDirection>>((acc, cur) => {
      if (cur && cur.sortDirection) acc.set(cur.id, cur.sortDirection)
      return acc
    }, new Map<string, SortDirection>())
    const results = await (this.data as FetchDataFunc)(filteredColumns, sortedColumns, this.internalOptions!)
    const originalIndices = Array.from({ length: results.data.length }, (_, i) => i)
    const totalRows = results.totalRows
    this.renderedData = results.data
    if (isDev()) end = performance.now()
    logWhenDev(`DataTable: fetchData function took: ${Math.round(end! - start!)} ms`)

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
    const csv = this.transformToCSV()
    const writableArrayOfObjects = await fileHandle.createWritable()
    await writableArrayOfObjects.write(csv)
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

  private transformToCSV(): string {
    if (!this.internalColumns || !this.renderedData) return ''
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
    return csvArrayObjObjects
  }
}
