import type { FetchDataFunc, IColumnMetaData, IDataTypeFunctionalities, IDataTypeInfo, IRender, ITableOptions } from '$lib/interfaces/Types'
import type Query from 'arquero/dist/types/query/query'

export abstract class DataTypeBase implements IDataTypeFunctionalities {
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

  abstract render(onlyPaginationChanged: boolean): Promise<IRender>

  abstract saveToFile(): Promise<void>

  abstract getBlob(): Promise<Blob>

  abstract replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void>

  abstract executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any>

  abstract executeQueryAndReturnResults(query: object | Query): Promise<any>

  abstract getFullRow(originalIndex: number): Promise<Record<string, any> | void>

  abstract getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any>

  abstract getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any>

  abstract insertRows(rows: Record<string, any>[]): Promise<number[] | void>

  abstract updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void>

  abstract renameColumns(columns: Record<string, string>): Promise<void>

  abstract applyFilter(data: any[] | any[][]): Promise<any[] | any[][] | void>

  abstract applySort(data: any[] | any[][]): Promise<any[] | any[][] | void>

  abstract setData(data: IDataTypeInfo): Promise<void>

  abstract setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]>

  abstract applyPagination(internalOptions: ITableOptions, data: any[] | any[][]): Promise<any[] | any[][] | undefined>

  abstract insertColumns(cols: IColumnMetaData[]): Promise<void | IColumnMetaData[]>

  abstract deleteRows(originalIndices: number[]): Promise<void>

  abstract destroy(): Promise<void>
}
