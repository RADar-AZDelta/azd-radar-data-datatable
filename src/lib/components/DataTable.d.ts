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
  storageMethod?: 'localStorage' | 'Firebase'
  rowsPerPageOptions?: number[]
  actionColumn?: boolean
  totalRows?: number
  defaultColumnWidth?: number
  globalFilter?: GlobalFilter
  singleSort?: boolean
  saveOptions?: boolean
  dataTypeImpl?: IDataTypeFunctionalities
  userId?: string | undefined | null
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

export interface IStoreOptions {
  load(id: string, columns?: IColumnMetaData[]): loadStore | Promise<loadStore>
  store(options: ITableOptions, columns: IColumnMetaData[]): void
}

export interface loadStore {
  savedOptions: ITableOptions
  savedColumns: IColumnMetaData[] | undefined
}

export interface IDataTypeFunctionalities {
  render(onlyPaginationChanged: boolean): IRender | Promise<IRender>
  setData(data: {
    data: any[] | any[][] | FetchDataFunc | File
    internalOptions: ITableOptions
    internalColumns: IColumnMetaData[] | undefined
    renderedData: any[] | any[][] | undefined
    modifyColumnMetadata?: ModifyColumnMetadataFunc
  }): Promise<void> | void
  setup?(): void | Promise<void>
  setInternalColumns(columns: IColumnMetaData[] | undefined): IColumnMetaData[] | Promise<IColumnMetaData[]>
  saveToFile(): Promise<void> | void
  replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void> | void
  executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any> | void
  executeQueryAndReturnResults(query: Query | object): Promise<any> | void
  insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[]> | IColumnMetaData[] | void
  getFullRow(originalIndex: number): Promise<Record<string, any>> | Record<string, any> | void
  deleteRows(originalIndices: number[]): Promise<void> | void
  insertRows(rows: Record<string, any>[]): Promise<number[]> | number[] | void
  updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void> | void
  renameColumns(columns: Record<string, string>): Promise<void> | void
  applySort?(internalColumns: IColumnMetaData[], data: any[]): any[] | any[][] | FetchDataFunc | File
  applyFilter?(internalColumns: IColumnMetaData[], data: any[]): any[] | any[][] | FetchDataFunc | File
  applyPagination?(internalOptions: ITableOptions, data: any[]): any[] | any[][] | FetchDataFunc | File
}

export interface IRender {
  renderedData: any[] | any[][] | undefined
  originalIndices: number[]
  totalRows?: number
  internalColumns: IColumnMetaData[] | undefined
}
