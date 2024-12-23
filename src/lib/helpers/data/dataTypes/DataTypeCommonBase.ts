import { logWhenDev } from '@dtlib/utils'
import { DataTypeBase } from '@dtlib/helpers/data/dataTypes/DataTypeBase'
import type { IColumnMetaData, IDataTypeFunctionalities, IDataTypeInfo, IRender, ITableFilter, ITableOptions } from '@dtlib/interfaces/Types'

export class DataTypeCommonBase extends DataTypeBase implements IDataTypeFunctionalities {
  async render(onlyPaginationChanged: boolean): Promise<IRender> {
    throw new Error('Method render not implemented.')
  }

  async saveToFile(): Promise<void> {
    throw new Error('Method saveToFile not implemented.')
  }

  async getBlob(): Promise<Blob> {
    throw new Error('Method getBlob not implemented.')
  }

  async replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> {
    throw new Error('Method replaceValuesOfColumn not implemented.')
  }

  async executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any> {
    throw new Error('Method executeExpressionsAndReturnResults not implemented.')
  }

  async executeQueryAndReturnResults(query: ITableFilter): Promise<any> {
    throw new Error('Method executeQueryAndReturnResults not implemented.')
  }

  async getFullRow(originalIndex: number): Promise<Record<string, any> | void> {
    throw new Error('Method getFullRow not implemented.')
  }

  async getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async insertRows(rows: Record<string, any>[]): Promise<number[] | void> {
    throw new Error('Method insertRows not implemented.')
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> {
    throw new Error('Method updateRows not implemented.')
  }

  async renameColumns(columns: Record<string, string>): Promise<void> {
    throw new Error('Method renameColumns not implemented.')
  }

  async applyFilter(data: any[] | any[][]): Promise<any[] | any[][] | void> {
    throw new Error('Method applyFilter not implemented.')
  }

  async applySort(data: any[] | any[][]): Promise<void | any[] | any[][]> {
    throw new Error('Method applySort not implemented.')
  }

  async setData(data: IDataTypeInfo): Promise<void> {
    if (data.data) this.data = data.data
    if (data.internalOptions) this.internalOptions = data.internalOptions
    if (data.internalColumns) this.internalColumns = data.internalColumns
    if (data.renderedData) this.renderedData = data.renderedData
  }

  async setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]> {
    if (!columns || !columns.length) throw new Error('Columns property is not provided')
    else this.internalColumns = columns

    if (this.internalOptions) {
      this.internalColumns.forEach(col => {
        if (!col.width) col.width = this.internalOptions!.defaultColumnWidth
      })
    }

    return this.internalColumns
  }

  async applyPagination(internalOptions: ITableOptions, data: any[] | any[][]): Promise<any[] | any[][] | undefined> {
    if (data) {
      if (internalOptions && internalOptions?.currentPage && internalOptions?.rowsPerPage) {
        const start = (internalOptions.currentPage! - 1) * internalOptions.rowsPerPage!
        const end = internalOptions.currentPage! * internalOptions.rowsPerPage!
        logWhenDev(`DataTable: applying pagination row ${start} - ${end}`)
        data = data.slice(start, end)
        return data
      } else return data.slice(0, 20)
    } else return undefined
  }

  async insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[] | void> {
    const uniqueColumns: IColumnMetaData[] = []
    for (const col of cols) {
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

  async deleteRows(originalIndices: number[]): Promise<void> {
    for (const originalIndex of originalIndices!.sort((a, b) => b - a)) {
      ;(this.data as any[])!.splice(originalIndex, 1)
    }
  }

  async destroy(): Promise<void> {}
}
