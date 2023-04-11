import { dev } from "$app/environment"
import type { IPagination, SortDirection, TFilter } from "$lib/components/DataTable"

export interface PostMessage<PostMessageMap extends {} = any> {
    msg: Extract<keyof PostMessageMap, string>,
    data?: PostMessageMap[Extract<keyof PostMessageMap, string>]
}

export interface MessageRequestLoadFile {
    url: string
    extension: string
}

export interface MessageRequestFetchData {
    filteredColumns: Map<string, TFilter>
    sortedColumns: Map<string, SortDirection>
    pagination: IPagination
}

export interface WorkerMessageRequests {
    loadFile: MessageRequestLoadFile
    getColumnNames: undefined
    fetchData: MessageRequestFetchData
}

export interface MessageResponseLoadFile {
    url: string
}

export interface MessageResponseGetColumnNames {
    columnNames: string[]
}

export interface MessageResponseFetchData {
    totalRows: number
    data: any[][]
}

export interface WorkerMessageResponses {
    loadFile: MessageResponseLoadFile
    getColumnNames: MessageResponseGetColumnNames
    fetchData: MessageResponseFetchData
}

// export function createWorkerMessagePoster<PostMessageMap extends {} = any>(): <PostMessageKey extends Extract<keyof PostMessageMap, string>>(
//     worker: Worker,
//     msg: PostMessageKey,
//     data?: PostMessageMap[PostMessageKey]
// ) => void {
//     return (worker: Worker, msg: string, data?: any): void => {
//         if (dev)
//             console.log(`postMessage: ${JSON.stringify({ msg, data })}`)
//         worker.postMessage({ msg, data })
//     }
// }
