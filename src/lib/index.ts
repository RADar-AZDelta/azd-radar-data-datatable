//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

import { default as DataTable } from './components/DataTable.svelte'
import { default as EditableCell } from './components/datatable/extra/EditableCell.svelte'
import { DataTypeCommonBase } from './helpers/data/dataTypes/DataTypeCommonBase'
import type {
  ITableOptions,
  IColumnMetaData,
  IPagination,
  FetchDataFunc,
  SortDirection,
  TFilter,
  ICustomStoreOptions,
  IDataTypeFunctionalities,
  IRender,
  IDataTypeInfo,
} from './interfaces/Types'

export type {
  ITableOptions,
  IColumnMetaData,
  IPagination,
  FetchDataFunc,
  SortDirection,
  TFilter,
  IRender,
  ICustomStoreOptions,
  IDataTypeFunctionalities,
  IDataTypeInfo,
}

export { DataTable as default, EditableCell, DataTypeCommonBase }
