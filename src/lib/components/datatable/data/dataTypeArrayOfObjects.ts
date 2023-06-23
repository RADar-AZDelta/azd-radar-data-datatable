import { dev } from '$app/environment'
import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeFunctionalities,
  IRender,
  ITableOptions,
  ModifyColumnMetadataFunc,
} from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'

export class dataTypeArrayOfObjects implements IDataTypeFunctionalities {
  data: any[] | undefined
  filteredAndSortedData: any[] | undefined
  modifyColumnMetadata: ModifyColumnMetadataFunc | undefined
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
    this.filteredAndSortedData = undefined
    this.modifyColumnMetadata = undefined
    this.renderedData = undefined
    this.internalColumns = undefined
    this.internalOptions = undefined
  }

  setData = (data: {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
    modifyColumnMetadata?: ModifyColumnMetadataFunc
  }): void => {
    if (data.data) this.data = data.data as any[]
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    if (data.modifyColumnMetadata) this.modifyColumnMetadata = data.modifyColumnMetadata
  }

  setInternalColumns = (columns: IColumnMetaData[] | undefined): IColumnMetaData[] => {
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

  render = (onlyPaginationChanged: boolean): IRender => {
    let totalRows: number = 0

    if (!onlyPaginationChanged || !this.filteredAndSortedData) {
      this.filteredAndSortedData = this.applySort(
        this.internalColumns,
        this.applyFilter(this.internalColumns, this.data as any[])
      )
      totalRows = this.filteredAndSortedData.length
    }
    this.renderedData = this.applyPagination(this.internalOptions!, this.filteredAndSortedData)
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

  applySort = (internalColumns: IColumnMetaData[] | undefined, data: any[]): any[] => {
    //TODO: ignore case, use localCompare for strings, convert Dates to milliseconds using .getTime()
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    internalColumns
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

  applyFilter = (internalColumns: IColumnMetaData[] | undefined, data: any[]): any[] => {
    let filteredData: any[] = data
    internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (dev) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        filteredData = filteredData.filter(obj => obj[col.id]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
      })
    return filteredData
  }

  applyPagination = (internalOptions: ITableOptions, data: any[]): any[] => {
    const start = (internalOptions.currentPage! - 1) * internalOptions.rowsPerPage!
    const end = internalOptions.currentPage! * internalOptions.rowsPerPage!
    if (dev) console.log(`DataTable: applying pagination row ${start} - ${end}`)
    data = data.slice(start, end)
    return data
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
    for (let i = 0; i < this.data!.length; i++) {
      if (this.data![i][column] === currentValue) this.data![i][column] = updatedValue
    }
  }

  executeExpressionsAndReturnResults = (expressions: Record<string, any>): void => {
    throw new Error('Can not execute an expression on an array of objects dataset')
  }

  executeQueryAndReturnResults = (query: Query | object): void => {
    throw new Error('Can not execute a query on an array of objects dataset')
  }

  insertColumns = (cols: IColumnMetaData[]): IColumnMetaData[] => {
    let uniqueColumns = []
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

  getFullRow = (originalIndex: number): Record<string, any> => {
    return (this.data as any[])[originalIndex]
  }

  deleteRows = (originalIndices: number[]): void => {
    for (const originalIndex of originalIndices!.sort((a, b) => b - a)) {
      this.data!.splice(originalIndex, 1)
    }
  }

  insertRows = (rows: Record<string, any>[]): number[] => {
    const originalIndices = Array.from({ length: rows.length }, (_, i) => this.data!.length + i)
    this.data!.push(...rows)

    return originalIndices
  }

  updateRows = (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): void => {
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
      Object.assign(this.data![originalIndex], row)
    }
  }

  renameColumns = (columns: Record<string, string>): void => {
    if (this.internalColumns) {
      Object.keys(columns).forEach(col => {
        const index = this.internalColumns!.findIndex(c => c.id === col)
        if (index !== -1) this.internalColumns![index].id = columns[col]

        for (let obj of this.data!) {
          obj[columns[col]] = obj[col]
          delete obj[col]
        }
      })
    }
  }
}
