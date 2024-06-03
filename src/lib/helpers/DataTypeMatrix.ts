import { DEV } from 'esm-env'
import { DataTypeCommonBase } from '$lib/helpers/DataTypeCommonBase'
import type { IDataTypeFunctionalities, IRender, IRowNavigation } from '$lib/interfaces/Types'

export class DataTypeMatrix extends DataTypeCommonBase implements IDataTypeFunctionalities {
  filteredAndSortedData: any[] | undefined

  async render(onlyPaginationChanged: boolean): Promise<IRender> {
    let totalRows = 0,
      originalIndices: number[] = []

    if (!onlyPaginationChanged || !this.filteredAndSortedData) {
      this.filteredAndSortedData = await this.applySort(await this.applyFilter(this.data as any[][]))
      if (this.filteredAndSortedData) totalRows = this.filteredAndSortedData.length
    } else totalRows = this.data!.length
    const paginatedData = await this.applyPagination(this.internalOptions!, this.filteredAndSortedData)
    if (paginatedData) {
      this.renderedData = paginatedData.map(row =>
        this.internalColumns?.reduce((acc, cur, index) => {
          acc[cur.id!] = row[index]
          return acc
        }, {} as Record<string, any>)
      )
      originalIndices = (paginatedData as any[]).reduce((acc, cur) => {
        acc.push((this.data as any[]).indexOf(cur))
        return acc
      }, [])
    }

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
    const writableMatrix = await fileHandle.createWritable()
    await writableMatrix.write(csv)
    await writableMatrix.close()
  }

  async getBlob(): Promise<Blob> {
    const csv = this.transformToCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    return blob
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    const columnIndex = this.internalColumns!.findIndex(col => col.id === column)
    for (let i = 0; i < this.data!.length; i++) {
      if ((this.data as any[][])![i][columnIndex] === currentValue) {
        ;(this.data as any[][])![i][columnIndex] = updatedValue
      }
    }
  }

  async getFullRow(originalIndex: number): Promise<Record<string, any>> {
    return this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id] = (this.data as any[][])[originalIndex][idx]
      return acc
    }, {} as Record<string, any>)
  }

  async getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<IRowNavigation> {
    const newIndex = currentIndex + 1
    const row = this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id] = (this.data as any[][])[newIndex][idx]
      return acc
    }, {} as Record<string, any>)
    let newPage: number = currentPage
    if (newIndex % rowsPerPage === 0) newPage++
    return { row, index: newIndex, page: newPage }
  }

  async getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any> {
    const newIndex = currentIndex - 1
    const row = this.internalColumns!.reduce((acc, column, idx) => {
      acc[column.id] = (this.data as any[][])[newIndex][idx]
      return acc
    }, {} as Record<string, any>)
    let newPage: number = currentPage
    if ((newIndex + 1) % rowsPerPage === 0) newPage--
    return { row, index: newIndex, page: newPage }
  }

  async insertRows(rows: Record<string, any>[]): Promise<number[]> {
    const originalIndices = Array.from({ length: rows.length }, (_, i) => this.data!.length + i)
    for (const row of rows) {
      ;(this.data as any[][])!.push(
        this.internalColumns!.reduce((acc, column) => {
          acc.push(row[column.id])
          return acc
        }, [] as any[])
      )
    }

    return originalIndices
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) {
      const originalRow = (this.data as any[][])![originalIndex]
      for (const [column, value] of Object.entries(row)) {
        const index = this.internalColumns?.findIndex(c => c.id === column)
        originalRow[index!] = value
      }
    }
  }

  async renameColumns(columns: Record<string, string>): Promise<void> {
    if (this.internalColumns) {
      Object.keys(columns).forEach(col => {
        const index = this.internalColumns!.findIndex(c => c.id === col)
        if (index !== -1) this.internalColumns![index].id = columns[col]
      })
    }
  }

  async applyFilter(data: any[][]): Promise<any[][]> {
    this.internalColumns
      ?.filter(col => col.filter)
      .forEach(col => {
        if (DEV) console.log(`DataTable: applying filter '${col.filter}' on column '${col.id}'`)
        const index = this.internalColumns?.findIndex(c => c.id === col.id)
        data = data.filter(row => row[index!]?.toString()?.toLowerCase().indexOf(col.filter) > -1)
      })
    return data
  }

  async applySort(data: any[][] | any[]): Promise<any[][]> {
    let compareFn: ((a: any[] | any, b: any[] | any) => number) | undefined
    this.internalColumns
      ?.filter(col => col.sortDirection)
      .slice()
      .reverse() //Sort is applied in reverse order !!!
      .forEach(col => {
        const index = this.internalColumns?.findIndex(obj => obj.id == col.id)
        if (index) {
          if (DEV) console.log(`DataTable: applying sort order '${col.sortDirection}' on column '${col.id} at index ${index}'`)
          switch (col.sortDirection) {
            case 'asc':
              compareFn = (a, b) =>
                this.standardizeValue(a[index]) < this.standardizeValue(b[index])
                  ? -1
                  : this.standardizeValue(a[index]) > this.standardizeValue(b[index])
                  ? 1
                  : 0
              break
            case 'desc':
              compareFn = (a, b) =>
                this.standardizeValue(b[index]) < this.standardizeValue(a[index])
                  ? -1
                  : this.standardizeValue(b[index]) > this.standardizeValue(a[index])
                  ? 1
                  : 0
              break
          }
          if (data) data = data.sort(compareFn)
        }
      })
    return data
  }

  private standardizeValue(value: string | number | Date): string | number {
    if (new Date(value).toString() !== 'Invalid Date' && !isNaN(new Date(value).getTime())) return new Date(value).getTime()
    else return value.toString().toLowerCase()
  }

  private transformToCSV() {
    let csvMatrix = ''
    let keyCounterMatrix = 0
    for (const col of this.internalColumns!) {
      csvMatrix += col.id + (keyCounterMatrix + 1 < this.internalColumns!.length ? ',' : '\r\n')
      keyCounterMatrix++
    }
    keyCounterMatrix = 0
    for (const row of (this.data as any[][])!) {
      for (const cell of row) {
        const value = cell.toString().replaceAll(',', ';')
        csvMatrix += value + (keyCounterMatrix + 1 < this.internalColumns!.length ? ',' : '\r\n')
        keyCounterMatrix++
      }
      keyCounterMatrix = 0
    }
    return csvMatrix
  }
}
