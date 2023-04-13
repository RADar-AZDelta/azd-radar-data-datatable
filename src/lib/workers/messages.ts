import type { IPagination, SortDirection, TFilter } from "$lib/components/DataTable"

export interface PostMessage<TData> {
    msg: string,
    data?: TData
}
export interface MessageRequestLoadFile {
    url: string
    extension: string
}
export interface MessageRequestFetchData {
    filteredColumns: Map<string, TFilter>
    sortedColumns: Map<string, SortDirection>
    pagination: IPagination,
    onlyPaginationChanged: boolean
}

export interface MessageResponseFetchData {
    totalRows: number
    data: any[][]
    indices: Uint32Array
}
export interface MessageRequestSaveToFile {
    fileHandle: FileSystemFileHandle
    options?: any
}

export interface MessageRequestUpdateRows {
    rowsByIndex: Map<number, Record<string, any>>
}

export interface MessageRequestInsertRows {
    rows: Record<string, any>[]
}

export interface MessageRequestDeleteRows {
    indices: number[]
}