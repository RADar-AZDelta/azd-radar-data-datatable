//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

import { default as DataTable } from './components/DataTable.svelte'
import { default as EditableCell } from './components/EditableCell.svelte'
import { DataTypeCommonBase } from './components/datatable/data/DataTypeCommonBase'
import type {
  ITableOptions,
  IColumnMetaData,
  IPagination,
  FetchDataFunc,
  SortDirection,
  TFilter,
  ICustomStoreOptions,
  IDataTypeFunctionalities,
  IStoredOptions,
} from './components/DataTable'
import styles from '$lib/styles/data-table.scss?inline'

export {
  DataTable as default,
  ITableOptions,
  IColumnMetaData,
  IPagination,
  FetchDataFunc,
  SortDirection,
  TFilter,
  EditableCell,
  ICustomStoreOptions,
  IDataTypeFunctionalities,
  DataTypeCommonBase,
  IStoredOptions,
  styles,
}
