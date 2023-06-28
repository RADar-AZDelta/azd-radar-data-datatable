//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal'
}

export type Hex = `#${string}`
export type SortDirection = 'asc' | 'desc' | undefined | null

// see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types
export type HTMLInputTypeAttribute =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

export type ModifyColumnMetadataFunc = (columns: IColumnMetaData[]) => IColumnMetaData[]

export interface IPagination {
  currentPage?: number
  rowsPerPage?: number
}

export interface ITableOptions extends IPagination {
  id?: string
  rowsPerPageOptions?: number[]
  actionColumn?: boolean
  totalRows?: number
  defaultColumnWidth?: number
  globalFilter?: GlobalFilter
  singleSort?: boolean
  saveOptions?: boolean
  dataTypeImpl?: IDataTypeFunctionalities
  saveImpl?: ICustomStoreOptions
}

export type FetchDataFunc = (
  filteredColumns: Map<string, TFilter>,
  sortedColumns: Map<string, SortDirection>,
  pagination: IPagination
) => Promise<{ totalRows: number; data: any[][] | any[] }>

export interface IColumnMetaData {
  id: string
  label?: string

  visible?: boolean
  sortable?: boolean
  filterable?: boolean
  resizable?: boolean
  repositionable?: boolean
  editable?: boolean

  sortDirection?: SortDirection
  sortOrder?: number

  filter?: any

  position?: number

  width?: number
}

export interface CustomTableEvents {
  columnSortChanged: ColumnSortChangedEventDetail
  columnFilterChanged: ColumnFilterChangedEventDetail
  paginationChanged: PaginationChangedEventDetail
  settingsVisibilityChanged: void
  columnPositionChanged: ColumnPositionChangedEventDetail
  columnWidthChanged: ColumnWidthChangedEventDetail
}

export interface ColumnPositionChangedEventDetail {
  column: string
  position: number
}

export interface ColumnWidthChangedEventDetail {
  column: string
  width: number
}

export interface ColumnSortChangedEventDetail {
  column: string
  sortDirection: SortDirection
}

export type TFilter = string | number | RegExp | Date | boolean | string[] | undefined | null

export interface ColumnFilterChangedEventDetail {
  column: string
  filter: TFilter
}

export interface GlobalFilter {
  column: string
  filter: TFilter
}

export interface PaginationChangedEventDetail extends IPagination {}

export interface ICustomStoreOptions {
  load(id: string, columns?: IColumnMetaData[]): IStoredOptions | Promise<IStoredOptions>
  store(options: ITableOptions, columns: IColumnMetaData[]): void
}

export interface IStoredOptions {
  tableOptions: ITableOptions
  columnMetaData: IColumnMetaData[] | undefined
}

export interface IDataTypeInfo {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
    modifyColumnMetadata?: ModifyColumnMetadataFunc
}

export interface IDataTypeBasicFunctionalities {
  setData(data: IDataTypeInfo): Promise<void>
  setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]>
  applyPagination(internalOptions: ITableOptions, data: any[] | any[][]): Promise<any[] | any[][]>
  insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[] | void>
  deleteRows(originalIndices: number[]): Promise<void>
  destroy(): Promise<void>
}

export interface IDataTypeFunctionalities extends IDataTypeBasicFunctionalities {
  render(onlyPaginationChanged: boolean): Promise<IRender>
  saveToFile(): Promise<void>
  getBlob(): Promise<Blob>
  replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void>
  executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any>
  executeQueryAndReturnResults(query: Query | object): Promise<any>
  getFullRow(originalIndex: number): Promise<Record<string, any>> | Promise<void>
  insertRows(rows: Record<string, any>[]): Promise<number[]> | Promise<void>
  updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void>
  renameColumns(columns: Record<string, string>): Promise<void>
  applyFilter(data: any[] | any[][]): Promise<any[] | any[][]> | Promise<void>
  applySort(data: any[] | any[][]): Promise<any[] | any[][]> | Promise<void>
}

export interface IRender {
  renderedData: any[] | any[][] | undefined
  originalIndices: number[]
  totalRows?: number
  internalColumns: IColumnMetaData[] | undefined
}
