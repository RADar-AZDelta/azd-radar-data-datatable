//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

import type {
    ITableOptions,
    IColumnMetaData,
    IPagination,
    FetchDataFunc,
    SortDirection,
    TFilter
} from "./components/DataTable";

import {
    default as DataTable,
} from './components/DataTable.svelte'

import {
    default as EditableCell,
} from './components/EditableCell.svelte'

export {
    DataTable as default,
    ITableOptions,
    IColumnMetaData,
    IPagination,
    FetchDataFunc,
    SortDirection,
    TFilter,
    EditableCell
};
