import type { Snippet } from 'svelte'
import type DataTable from '../helpers/datatable/DataTable.svelte'

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
  paginationOnTop?: boolean
  paginationThroughArrowsOnly?: boolean
  hidePagination?: boolean
  hideOptions?: boolean
  rowsPerPageOptions?: number[]
  actionColumn?: boolean
  totalRows?: number
  defaultColumnWidth?: number
  globalFilter?: GlobalFilter
  singleSort?: boolean
  saveOptions?: boolean
  dataTypeImpl?: IDataTypeFunctionalities
  saveImpl?: ICustomStoreOptions
  hideFilters?: boolean
  addRow?: 'top' | 'bottom' | false
}

export type FetchDataFunc = (
  filteredColumns: Map<string, TFilter>,
  sortedColumns: Map<string, SortDirection>,
  pagination: IPagination,
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
  [key: string]: any
}

export interface CustomTableEvents {
  columnSortChanged: ColumnSortChangedED
  columnFilterChanged: ColumnFilterChangedED
  paginationChanged: PaginationChangedED
  settingsVisibilityChanged: void
  columnPositionChanged: ColumnPositionChangedED
  columnWidthChanged: ColumnWidthChangedED
}

export interface ColumnPositionChangedED {
  column: string
  position: number
}

export interface ColumnWidthChangedED {
  column: string
  width: number
}

export interface ColumnSortChangedED {
  column: string
  sortDirection: SortDirection
}

export type TFilter = string | number | RegExp | Date | boolean | string[] | undefined | null

export interface ColumnFilterChangedED {
  column: string
  filter: TFilter
}

export interface GlobalFilter {
  column: string
  filter: TFilter
}

export type PaginationChangedED = IPagination

export interface ICustomStoreOptions {
  loadOptions(id: string): ITableOptions
  loadColumns(id: string, internalColumns?: IColumnMetaData[]): void | IColumnMetaData[]
  storeOptions(options: ITableOptions): void
  storeColumns(id: string | undefined, saveOptions: boolean | undefined, columns?: IColumnMetaData[]): void
}

export interface IDataTypeInfo {
  data: any[] | any[][] | FetchDataFunc | File | undefined
  internalOptions?: ITableOptions
  internalColumns?: IColumnMetaData[] | undefined
  renderedData?: any[] | any[][] | undefined
  modifyColumnMetadata?: ModifyColumnMetadataFunc
}

export interface IDataTypeFunctionalities {
  data: any[] | any[][] | FetchDataFunc | File | undefined
  render(onlyPaginationChanged: boolean): Promise<IRender>
  saveToFile(): Promise<void>
  getBlob(): Promise<Blob>
  replaceValuesOfColumn(currentValue: any, updatedValue: any, column: string): Promise<void>
  executeExpressionsAndReturnResults(expressions: Record<string, any>): Promise<any>
  executeQueryAndReturnResults(query: ITableFilter): Promise<any>
  getFullRow(originalIndex: number): Promise<Record<string, any> | void>
  getNextRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any>
  getPreviousRow(currentIndex: number, rowsPerPage: number, currentPage: number): Promise<any>
  insertRows(rows: Record<string, any>[]): Promise<number[] | void>
  updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>): Promise<void>
  renameColumns(columns: Record<string, string>): Promise<void>
  applyFilter(data: any[] | any[][]): Promise<any[] | any[][] | void>
  applySort(data: any[] | any[][]): Promise<any[] | any[][] | void>
  setData(data: IDataTypeInfo): Promise<void>
  setInternalColumns(columns: IColumnMetaData[] | undefined): Promise<IColumnMetaData[]>
  applyPagination(internalOptions: ITableOptions, data: any[] | any[][]): Promise<any[] | any[][] | undefined>
  insertColumns(cols: IColumnMetaData[]): Promise<IColumnMetaData[] | void>
  deleteRows(originalIndices: number[]): Promise<void>
  destroy(): Promise<void>
}

export interface IRender {
  renderedData: any[] | any[][] | undefined
  originalIndices: number[]
  totalRows?: number
  internalColumns: IColumnMetaData[] | undefined
}

export interface IColumnFilterProps {
  column: string
  inputType: string
  filter: TFilter
  dt: DataTable
}

export interface IColumnResizeProps {
  column: IColumnMetaData
  minWidth?: number
  child: Snippet
  dt: DataTable
}

export interface IColumnSortProps {
  column: string
  sortDirection: SortDirection
  disabled: boolean
  filledColor?: Hex
  notFilledColor?: Hex
  filledOpacity?: number
  notFilledOpacity?: number
  dt: DataTable
}

export interface IEditableCellProps {
  value: any
  changeValue: (value: any) => Promise<void>
}

export interface IOptionsProps {
  disabled: boolean
  changeVisibility: () => Promise<void>
}

export interface IPaginationProps {
  paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>
  dt: DataTable
}

export interface ISvgIconProps {
  id: string
  width?: string
  height?: string
}

export interface IDataTableProps {
  data: any[][] | any[] | FetchDataFunc | File | undefined
  columns?: IColumnMetaData[] | undefined
  options?: ITableOptions | undefined
  disabled?: boolean
  modifyColumnMetadata?: ModifyColumnMetadataFunc
  initialized?: () => Promise<void>
  rendering?: () => Promise<void>
  rendered?: () => Promise<void>
  paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>
  rowChild?: Snippet<[{ renderedRow: any; originalIndex: number; index: number; columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  actionHeaderChild?: Snippet<[{ columns: IColumnMetaData[]; options: ITableOptions }]>
  actionCellChild?: Snippet<[{ renderedRow: any; originalIndex: number; index: number; columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  loadingChild?: Snippet
  noDataChild?: Snippet
  addRowChild?: Snippet<[{ columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
}

export interface IRowNavigation {
  row: Record<string, any>
  index: number
  page: number
}

export interface IDialogProps {
  dialog?: HTMLDialogElement
  width: string | number
  height: string | number
  title?: string
  close?: () => Promise<any>
  children?: Snippet
  buttonsChildren?: Snippet
  canClose?: boolean
}

export interface IColGroupProps {
  dt: DataTable
}

export interface ITableHeadProps {
  paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>
  actionHeaderChild?: Snippet<[{ columns: IColumnMetaData[]; options: ITableOptions }]>
  dt: DataTable
}

export interface IExtraLayer {
  paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>
  dt: DataTable
}

export interface ILoaderProps {
  loadingChild?: Snippet
  dt: DataTable
}

export interface ITableBodyProps {
  addRowChild?: Snippet<[{ columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  rowChild?: Snippet<[{ renderedRow: any; originalIndex: number; index: number; columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  actionCellChild?: Snippet<[{ renderedRow: any; originalIndex: number; index: number; columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  loadingChild?: Snippet
  noDataChild?: Snippet
  dt: DataTable
}

export interface ITableBodyRowProps {
  row: any
  index: number
  actionCellChild?: Snippet<[{ renderedRow: any; originalIndex: number; index: number; columns: IColumnMetaData[] | undefined; options: ITableOptions }]>
  dt: DataTable
}

export interface ITableFootProps {
  paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>
  dt: DataTable
}

export interface IFilterRowProps {
  actionHeaderChild?: Snippet<[{ columns: IColumnMetaData[]; options: ITableOptions }]>
  dt: DataTable
}

export interface ITitleRowProps {
  dt: DataTable
}

export interface ISettingsProps {
  dt: DataTable
}

export type ITableFilter = (props: {row: Record<string, any>, index: number}) => boolean