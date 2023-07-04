import type {
  IColumnMetaData,
  IDataTypeFunctionalities,
  IDataTypeInfo,
  IRender,
  ModifyColumnMetadataFunc,
} from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'
import { dev } from '$app/environment'
import { DataTypeCommonBase } from './DataTypeCommonBase'

export class DataTypeArrayOfObjects extends DataTypeCommonBase implements IDataTypeFunctionalities {
  filteredAndSortedData: any[] | undefined
  modifyColumnMetadata: ModifyColumnMetadataFunc | undefined

  async setData (data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as any[]
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    if (data.modifyColumnMetadata) this.modifyColumnMetadata = data.modifyColumnMetadata
  }

  async setInternalColumns (columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns) {
      //columns is not defined, and data is an array of objects => extract the columns from the first object
      this.internalColumns = Object.keys((this.data as any[])[0]).map((key, index) => ({
        id: key,
        position: index + 1,
      }))

      if (this.modifyColumnMetadata) this.internalColumns = this.modifyColumnMetadata(this.internalColumns)
    } else this.internalColumns = columns

    this.internalColumns.forEach(col => {
      if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
    })

    return this.internalColumns
  }

  async render (onlyPaginationChanged: boolean): Promise<IRender> {
    let totalRows: number = 0

    if (!onlyPaginationChanged || !this.filteredAndSortedData) {
      this.filteredAndSortedData = await this.applySort(await this.applyFilter(this.data as any[]))
      totalRows = this.filteredAndSortedData.length
    }
    this.renderedData = await this.applyPagination(this.internalOptions!, this.filteredAndSortedData)
    const originalIndices = (this.renderedData as Record<string, any>[]).reduce<number[]>((acc, cur) => {
      acc.push((this.data as Record<string, any>[]).indexOf(cur))
      return acc
    }, [])

    return {
      renderedData: this.renderedData,
      originalIndices,
      totalRows,
      internalColumns: this.internalColumns,
    }
  }

  async saveToFile (): Promise<void> {
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

  async getBlob (): Promise<Blob> {
    let csvArrayObjObjects = ''
    let keyCounterArrayOfObjects: number = 0
    for (let row = 0; row <= this.renderedData!.length; row++) {
      for (let col of this.internalColumns!) {
        if (row == 0) {
          csvArrayObjObjects += col.id + (keyCounterArrayOfObjects + 1 < this.internalColumns!.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        } else {
          if((<any[]>this.renderedData)[row - 1][col.id as keyof object]){
            const value = (<any[]>this.renderedData)[row - 1][col.id as keyof object].toString().replaceAll(',', ';')
            csvArrayObjObjects += value + (keyCounterArrayOfObjects + 1 < this.internalColumns!.length ? ',' : '\r\n')
            keyCounterArrayOfObjects++
          }
        }
      }
      keyCounterArrayOfObjects = 0
    }
    const blob = new Blob([csvArrayObjObjects], { type: 'text/csv'})
    return blob
  }

  async replaceValuesOfColumn (currentValue: any, updatedValue: any, column: string): Promise<void> {
    for (let i = 0; i < this.data!.length; i++) {
      if ((this.data as any[])![i][column] === currentValue) (this.data as any[])![i][column] = updatedValue
    }
  }

  async executeExpressionsAndReturnResults (expressions: Record<string, any>): Promise<void> {
  }

  async executeQueryAndReturnResults (query: Query | object): Promise<void> {
  }

  async getFullRow (originalIndex: number): Promise<Record<string, any>> {
    return (this.data as any[])[originalIndex]
  }

  async insertRows (rows: Record<string, any>[]): Promise<number[]> {
    const data = this.data as any[]
    const originalIndices = Array.from({ length: rows.length }, (_, i) => data.length + i)
    data!.push(...rows)
    this.data = data

    return originalIndices
  }

  async updateRows (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
      Object.assign((this.data as any[])![originalIndex], row)
    }
  }

  async renameColumns (columns: Record<string, string>): Promise<void> {
    if (this.internalColumns) {
      Object.keys(columns).forEach(col => {
        const index = this.internalColumns!.findIndex(c => c.id === col)
        if (index !== -1) this.internalColumns![index].id = columns[col]

        for (let obj of (this.data as any[])!) {
          obj[columns[col]] = obj[col]
          delete obj[col]
        }
      })
    }
  }

  async applyFilter (data: any[]): Promise<any[]> {
    this.internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (dev) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        data = data.filter(obj => obj[col.id]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
      })
    return data
  }

  async applySort(data: any[]): Promise<any[]> {
    //TODO: ignore case, use localCompare for strings, convert Dates to milliseconds using .getTime()
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    this.internalColumns
      ?.filter(col => col.sortDirection)
      .slice()
      .reverse() //Sort is applied in reverse order !!!
      .forEach((col, index) => {
        if (dev) console.log(`DataTable: applying sort order '${col.sortDirection}' on column '${col.id}'`)
        switch (col.sortDirection) {
          case 'asc':
            compareFn = (a, b) => (a[col.id] < b[col.id] ? -1 : a[col.id] > b[col.id] ? 1 : 0)
            break
          case 'desc':
            compareFn = (a, b) => (b[col.id] < a[col.id] ? -1 : b[col.id] > a[col.id] ? 1 : 0)
            break
        }
        data = data.sort(compareFn)
      })
    return data
  }
}
