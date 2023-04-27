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

export {
    DataTable,
    ITableOptions,
    IColumnMetaData,
    IPagination,
    FetchDataFunc,
    SortDirection,
    TFilter
};
