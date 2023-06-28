import { dev } from '$app/environment'
import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeBasicFunctionalities,
  IDataTypeInfo,
  ITableOptions,
} from '$lib/components/DataTable'

export class DataTypeBase implements IDataTypeBasicFunctionalities {
    data: any[] | any[][] | File | FetchDataFunc | undefined
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

  async setData (data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
  }

  async setInternalColumns (columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns) throw new Error('Columns property is not provided')
    else this.internalColumns = columns

    this.internalColumns.forEach(col => {
      if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
    })

    return this.internalColumns
  }

  async applyPagination (internalOptions: ITableOptions, data: any[] | any[][]): Promise<any[] | any[][]> {
    const start = (internalOptions.currentPage! - 1) * internalOptions.rowsPerPage!
    const end = internalOptions.currentPage! * internalOptions.rowsPerPage!
    if (dev) console.log(`DataTable: applying pagination row ${start} - ${end}`)
    data = data.slice(start, end)
    return data
  }

  async insertColumns (cols: IColumnMetaData[]): Promise<IColumnMetaData[] | void> {
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
    this.internalColumns = this.internalColumns!.concat(uniqueColumns)
    return this.internalColumns
  }

  async deleteRows (originalIndices: number[]): Promise<void> {
    for (const originalIndex of originalIndices!.sort((a, b) => b - a)) {
      (this.data as any[])!.splice(originalIndex, 1)
    }
  }

  async destroy(): Promise<void> {}
}
