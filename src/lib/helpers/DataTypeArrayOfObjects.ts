import { DEV } from 'esm-env'
import { DataTypeCommonBase } from '$lib/helpers/DataTypeCommonBase'
import type { IColumnMetaData, IDataTypeFunctionalities, IDataTypeInfo, IRender, ITableOptions, ModifyColumnMetadataFunc } from '$lib/interfaces/Types'

export class DataTypeArrayOfObjects extends DataTypeCommonBase implements IDataTypeFunctionalities {
  filteredAndSortedData: any[] | undefined
  modifyColumnMetadata: ModifyColumnMetadataFunc | undefined

  async setData(data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data as any[]
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
    if (data.modifyColumnMetadata) this.modifyColumnMetadata = data.modifyColumnMetadata
  }

  async setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns) {
      //columns is not defined, and data is an array of objects => extract the columns from the first object
      this.internalColumns = Object.keys((this.data as any[])[0]).map((key, index) => ({
        id: key,
        position: index + 1,
      }))

      if (this.modifyColumnMetadata) this.internalColumns = this.modifyColumnMetadata(this.internalColumns)
    } else this.internalColumns = columns

    if (this.internalOptions) for (const col of this.internalColumns) if (!col.width) col.width = this.internalOptions?.defaultColumnWidth

    return this.internalColumns
  }

  async render(onlyPaginationChanged: boolean): Promise<IRender> {
    let totalRows = 0

    if (!onlyPaginationChanged || !this.filteredAndSortedData) {
      this.filteredAndSortedData = await this.applySort(await this.applyFilter(this.data as any[]))
      if (this.filteredAndSortedData) totalRows = this.filteredAndSortedData.length
    } else totalRows = (<any[]>this.data).length
    this.renderedData = await this.applyPagination(<ITableOptions>this.internalOptions, this.filteredAndSortedData)
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

  async saveToFile(): Promise<void> {
    const fileHandle: FileSystemFileHandle = await (<any>window).showSaveFilePicker(this.saveOptions)
    const csv = this.transformToCSV()
    const writableArrayOfObjects = await fileHandle.createWritable()
    await writableArrayOfObjects.write(csv)
    await writableArrayOfObjects.close()
  }

  async getBlob(): Promise<Blob> {
    const csv = this.transformToCSV()
    return new Blob([csv], { type: 'text/csv' })
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    for (let i = 0; i < this.data!.length; i++) if ((this.data as any[])![i][column] === currentValue) (this.data as any[])[i][column] = updatedValue
  }

  getFullRow = async (originalIndex: number): Promise<Record<string, any>> => (this.data as any[])[originalIndex]

  async getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any> {
    const newIndex = currentIndex + 1
    const row = (this.data as any[])[newIndex]
    let newPage: number = currentPage
    if (currentIndex % rowsPerPage === 0) newPage++
    return { row, index: newIndex, page: newPage }
  }

  async getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any> {
    const newIndex = currentIndex - 1
    const row = (this.data as any[])[newIndex]
    let newPage: number = currentPage
    if ((currentIndex + 1) % rowsPerPage === 0) newPage--
    return { row, index: newIndex, page: newPage }
  }

  async insertRows(rows: Record<string, any>[]): Promise<number[]> {
    const data = this.data as any[]
    const originalIndices = Array.from({ length: rows.length }, (_, i) => data.length + i)
    data!.push(...rows)
    this.data = data
    return originalIndices
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) Object.assign((this.data as any[])[originalIndex], row)
  }

  async renameColumns(columns: Record<string, string>): Promise<void> {
    if (!this.internalColumns) return
    Object.keys(columns).forEach(col => {
      const index = this.internalColumns!.findIndex(c => c.id === col)
      if (index !== -1) this.internalColumns![index].id = columns[col]

      for (const obj of (this.data as any[])!) {
        obj[columns[col]] = obj[col]
        delete obj[col]
      }
    })
  }

  async applyFilter(data: any[]): Promise<any[]> {
    this.internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (DEV) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        data = data.filter(obj => obj[col.id]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
      })
    return data
  }

  async applySort(data: any[]): Promise<any[]> {
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    this.internalColumns
      ?.filter(col => col.sortDirection)
      .slice()
      .reverse() //Sort is applied in reverse order !!!
      .forEach(col => {
        if (DEV) console.log(`DataTable: applying sort order '${col.sortDirection}' on column '${col.id}'`)
        if (col.sortDirection === 'asc')
          compareFn = (a, b) => {
            const colA = this.standardizeValue(a[col.id])
            const colB = this.standardizeValue(b[col.id])
            return colA < colB ? -1 : colA > colB ? 1 : 0
          }
        else if (col.sortDirection === 'desc')
          compareFn = (a, b) => {
            const colA = this.standardizeValue(a[col.id])
            const colB = this.standardizeValue(b[col.id])
            return colB < colA ? -1 : colB > colA ? 1 : 0
          }
        if (data) data = data.sort(compareFn)
      })
    return data
  }

  private standardizeValue(value: string | number | Date): string | number {
    if (new Date(value).toString() !== 'Invalid Date' && !isNaN(new Date(value).getTime())) return new Date(value).getTime()
    return value.toString().toLowerCase()
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
          let value = (<any[]>this.renderedData)[row - 1][col.id as keyof object]
          if (value === null || value === undefined) value = ''
          value = value.toString().replaceAll(',', ';')
          csvArrayObjObjects += value + (keyCounterArrayOfObjects + 1 < this.internalColumns.length ? ',' : '\r\n')
          keyCounterArrayOfObjects++
        }
      }
      keyCounterArrayOfObjects = 0
    }
    return csvArrayObjObjects
  }
}
