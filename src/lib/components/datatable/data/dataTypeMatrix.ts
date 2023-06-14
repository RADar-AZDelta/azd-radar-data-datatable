import { dev } from '$app/environment'
import type {
  FetchDataFunc,
  IColumnMetaData,
  IDataTypeFunctionalities,
  IRender,
  ITableOptions,
} from '$lib/components/DataTable'
import type Query from 'arquero/dist/types/query/query'

export class dataTypeMatrix implements IDataTypeFunctionalities {
  data: any[][] | undefined
  renderedData: any[] | any[][] | undefined
  filteredAndSortedData: any[] | undefined
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
  }

  setData = (data: {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
  }): void => {
    if (data.data) this.data = data.data as any[][]
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

  render = (onlyPaginationChanged: boolean): IRender => {
    let totalRows: number = 0

    if (!onlyPaginationChanged || !this.filteredAndSortedData) {
      this.filteredAndSortedData = this.applySort(
        this.internalColumns,
        this.applyFilter(this.internalColumns, this.data as any[][])
      )
      totalRows = this.filteredAndSortedData.length
    } else totalRows = this.data!.length
    const paginatedData = this.applyPagination(this.internalOptions!, this.filteredAndSortedData)
    this.renderedData = paginatedData.map(row =>
      this.internalColumns?.reduce((acc, cur, index) => {
        acc[cur.id!] = row[index]
        return acc
      }, {} as Record<string, any>)
    )

    const originalIndices = (paginatedData as any[]).reduce((acc, cur) => {
      acc.push((this.data as any[]).indexOf(cur))
      return acc
    }, [])

    return {
      renderedData: this.renderedData,
      originalIndices,
      totalRows,
      internalColumns: this.internalColumns,
    }
  }

  applySort = (internalColumns: IColumnMetaData[] | undefined, data: any[][]): any[][] => {
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
            compareFn = (a, b) => (a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : 0)
            break
          case 'desc':
            compareFn = (a, b) => (b[index] < a[index] ? -1 : b[index] > a[index] ? 1 : 0)
            break
        }
        data = data.sort(compareFn)
      })
    return data
  }

  applyFilter = (internalColumns: IColumnMetaData[] | undefined, data: any[][]): any[][] => {
    let filteredData: any[] = data
    internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (dev) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        const index = internalColumns?.findIndex(c => c.id === col.id)
        filteredData = filteredData.filter(row => row[index!]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
      })
    return filteredData
  }

  applyPagination = (internalOptions: ITableOptions, data: any[][]): any[][] => {
    const start = (internalOptions.currentPage! - 1) * internalOptions.rowsPerPage!
    const end = internalOptions.currentPage! * internalOptions.rowsPerPage!
    if (dev) console.log(`DataTable: applying pagination row ${start} - ${end}`)
    data = data.slice(start, end)
    return data
  }

  saveToFile = async (): Promise<void> => {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    let csvMatrix = ''
    let keyCounterMatrix: number = 0
    for (let col of this.internalColumns!) {
      csvMatrix += col.id + (keyCounterMatrix + 1 < this.internalColumns!.length ? ',' : '\r\n')
      keyCounterMatrix++
    }
    keyCounterMatrix = 0
    for (let row of this.data!) {
      for (let cell of row) {
        const value = cell.toString().replaceAll(',', ';')
        csvMatrix += value + (keyCounterMatrix + 1 < this.internalColumns!.length ? ',' : '\r\n')
        keyCounterMatrix++
      }
      keyCounterMatrix = 0
    }
    const writableMatrix = await fileHandle.createWritable()
    await writableMatrix.write(csvMatrix)
    await writableMatrix.close()
  }

  replaceValuesOfColumn = (currentValue: any, updatedValue: any, column: string): void => {
    let columnIndex = this.internalColumns!.findIndex(col => col.id === column)
    for (let i = 0; i < this.data!.length; i++) {
      if (this.data![i][columnIndex] === currentValue) {
        this.data![i][columnIndex] = updatedValue
      }
    }
  }

  executeExpressionsAndReturnResults = (expressions: Record<string, any>): void => {
    throw new Error('Can not execute an expression on a matrix dataset')
  }

  executeQueryAndReturnResults = (query: Query | object): void => {
    throw new Error('Can not execute a query on a matrix dataset')
  }

  insertColumns = (cols: IColumnMetaData[]): IColumnMetaData[] => {
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
    this.internalColumns = this.internalColumns
    return this.internalColumns
  }

  getFullRow = (originalIndex: number): Record<string, any> => {
    return this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id] = (this.data as any[][])[originalIndex][idx]
      return acc
    }, {} as Record<string, any>)
  }

  deleteRows = (originalIndices: number[]): void => {
    for (const originalIndex of originalIndices!.sort((a, b) => b - a)) {
      this.data!.splice(originalIndex, 1)
    }
  }

  insertRows = (rows: Record<string, any>[]): number[] => {
    const originalIndices = Array.from({ length: rows.length }, (_, i) => this.data!.length + i)
    for (const row of rows) {
      this.data!.push(
        this.internalColumns!.reduce((acc, column) => {
          acc.push(row[column.id])
          return acc
        }, [] as any[])
      )
    }

    return originalIndices
  }

  updateRows = (rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): void => {
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
      const originalRow = this.data![originalIndex]
      for (const [column, value] of Object.entries(row)) {
        const index = this.internalColumns?.findIndex(c => c.id === column)
        originalRow[index!] = value
      }
    }
  }

  renameColumns = (columns: Record<string, string>): void => {
    if (this.internalColumns) {
      Object.keys(columns).forEach(col => {
        const index = this.internalColumns!.findIndex(c => c.id === col)
        if (index !== -1) this.internalColumns![index].id = columns[col]
      })
    }
  }
}
