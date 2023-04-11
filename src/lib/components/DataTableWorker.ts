import { dev } from "$app/environment";
import type { MessageResponseLoadFile, PostMessage, WorkerMessageResponses, WorkerMessageRequests, MessageResponseGetColumnNames, MessageResponseFetchData } from "$lib/workers/messages";
import type { IPagination, SortDirection, TFilter } from "./DataTable";

export class DataTableWorker {
    private worker: Worker | undefined

    constructor() { }

    async init() {
        const DataTableWorker = await import('$lib/workers/DataTable.worker?worker')
        this.worker = new DataTableWorker.default()
    }

    private postWorkerMessage(msg: keyof WorkerMessageRequests, data?: WorkerMessageRequests[keyof WorkerMessageRequests]): void {
        this.worker!.postMessage({ msg, data })
    }

    async loadFile(url: string, extension: string) {
        let start: number
        if (dev)
            start = performance.now();
        await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                if (msg != 'loadFile')
                    reject(`Recieved unexpected message from web worker (expected 'loadFile', but recieved '${msg}')`)
                const url = (data as MessageResponseLoadFile).url
                URL.revokeObjectURL(url)
                resolve(undefined)
            }
            this.postWorkerMessage('loadFile', { url, extension })
        })
        if (dev) {
            const end = performance.now();
            console.log(`loadFile took: ${Math.round(end - start!)} ms`);
        }
    }

    async getColumnNames(): Promise<string[]> {
        let start: number
        if (dev)
            start = performance.now();
        const columnNames: string[] = await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                if (msg != 'getColumnNames')
                    reject(`Recieved unexpected message from web worker (expected 'getColumnNames', but recieved '${msg}')`)
                resolve((data as MessageResponseGetColumnNames).columnNames)
            }
            this.postWorkerMessage('getColumnNames')
        })
        if (dev) {
            const end = performance.now();
            console.log(`getColumnNames took ${Math.round(end - start!)} ms`);
        }
        return columnNames
    }

    async fetchData(filteredColumns: Map<string, TFilter>,
        sortedColumns: Map<string, SortDirection>,
        pagination: IPagination,
        onlyPaginationChanged: boolean): Promise<{ totalRows: number, data: any[][] }> {
        let start: number
        if (dev)
            start = performance.now();
        const results: { totalRows: number, data: any[][] } = await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                if (msg != 'fetchData')
                    reject(`Recieved unexpected message from web worker (expected 'fetchData', but recieved '${msg}')`)
                resolve(data as MessageResponseFetchData)
            }
            this.postWorkerMessage('fetchData', { filteredColumns, sortedColumns, pagination, onlyPaginationChanged })
        })
        if (dev) {
            const end = performance.now();
            console.log(`fetchData took ${Math.round(end - start!)} ms`);
        }
        return results
    }
}
