//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

import { default as DataTable } from '@dtlib/components/DataTable.svelte'
import { default as EditableCell } from '@dtlib/components/datatable/extra/EditableCell.svelte'
import { DataTypeCommonBase } from '@dtlib/helpers/data/dataTypes/DataTypeCommonBase'
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
} from '@dtlib/interfaces/Types'

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
