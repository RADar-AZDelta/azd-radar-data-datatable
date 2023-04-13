import { dev } from "$app/environment"
import type { PostMessage, MessageResponseFetchData, MessageRequestLoadFile, MessageRequestFetchData, MessageRequestSaveToFile } from "$lib/workers/messages"
import type { IPagination, SortDirection, TFilter } from "./DataTable"

export class DataTableWorker {
    private worker: Worker | undefined

    constructor() { }

    async init() {
        const DataTableWorker = await import('$lib/workers/DataTable.worker?worker')
        this.worker = new DataTableWorker.default()
    }

    destroy() {
        this.worker?.terminate()
    }

    private async executeWorkerMethod<TData, TResult>(requestMsg: string, data?: TData): Promise<TResult> {
        let start: number
        if (dev)
            start = performance.now()
        const result = await new Promise<TResult>((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg: responseMsg, data } }: MessageEvent<PostMessage<TResult>>) => {
                if (responseMsg != requestMsg)
                    reject(`Recieved unexpected message from web worker (expected '${requestMsg}', but recieved '${responseMsg}')`)
                resolve(data as TResult)
            }
            this.worker!.postMessage({ msg: requestMsg, data })
        })
        if (dev) {
            const end = performance.now()
            console.log(`${requestMsg} took: ${Math.round(end - start!)} ms`)
        }
        return result
    }

    async loadFile(url: string, extension: string): Promise<void> {
        await this.executeWorkerMethod<MessageRequestLoadFile, undefined>("loadFile", { url, extension })
    }

    async getColumnNames(): Promise<string[]> {
        return await this.executeWorkerMethod<unknown, string[]>("getColumnNames")
    }

    async fetchData(filteredColumns: Map<string, TFilter>,
        sortedColumns: Map<string, SortDirection>,
        pagination: IPagination,
        onlyPaginationChanged: boolean): Promise<{ totalRows: number, data: any[][], indices: Uint32Array }> {
        return await this.executeWorkerMethod<MessageRequestFetchData, MessageResponseFetchData>("fetchData", { filteredColumns, sortedColumns, pagination, onlyPaginationChanged })
    }

    async saveToFile(fileHandle: FileSystemFileHandle, options?: any): Promise<void> {
        return await this.executeWorkerMethod<MessageRequestSaveToFile, void>("saveToFile", { fileHandle, options })
    }
}
