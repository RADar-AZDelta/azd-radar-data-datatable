//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal';
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

export interface IPagination {
  currentPage: number
  rowsPerPage: number
}

export interface ITableOptions {
  rowsPerPage?: number
  rowsPerPageOptions?: number[]
  actionColumn?: boolean
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

  sortDirection?: SortDirection
  sortOrder?: number

  filter?: any

  position?: number

  width?: number | 'auto'
}

export interface CustomTableEvents {
  columnSortChanged: ColumnSortChangedEventDetail
  columnFilterChanged: ColumnFilterChangedEventDetail
  paginationChanged: PaginationChangedEventDetail
  settingsVisibilityChanged: SettingsVisibilityChangedEventDetail
  columnPositionChanged: ColumnPositionChangedEventDetail
}

export interface ColumnPositionChangedEventDetail {
  column: string
  position: number
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

export interface PaginationChangedEventDetail extends IPagination { }

export interface SettingsVisibilityChangedEventDetail {
  visibility: boolean
}

export enum DataType {
  Matrix,
  ArrayOfObjects,
  Function,
  File,
}
