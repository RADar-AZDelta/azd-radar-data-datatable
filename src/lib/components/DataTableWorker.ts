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
        // if (dev)
        //     console.log(`postMessage: ${JSON.stringify({ msg, data })}`)
        this.worker!.postMessage({ msg, data })
    }

    async loadFile(url: string, extension: string) {
        await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                // if (dev)
                //     console.log(`GUI onmessage: ${JSON.stringify({ msg, data })}`)
                if (msg != 'loadFile')
                    reject(`Recieved unexpected message from web worker (expected 'loadFile', but recieved '${msg}')`)
                const url = (data as MessageResponseLoadFile).url
                URL.revokeObjectURL(url)
                resolve(undefined)
            }
            this.postWorkerMessage('loadFile', { url, extension })
        })
    }

    async getColumnNames(): Promise<string[]> {
        return await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                // if (dev)
                //     console.log(`GUI onmessage: ${JSON.stringify({ msg, data })}`)
                if (msg != 'getColumnNames')
                    reject(`Recieved unexpected message from web worker (expected 'getColumnNames', but recieved '${msg}')`)
                resolve((data as MessageResponseGetColumnNames).columnNames)
            }
            this.postWorkerMessage('getColumnNames')
        })
    }

    async fetchData(filteredColumns: Map<string, TFilter>,
        sortedColumns: Map<string, SortDirection>,
        pagination: IPagination): Promise<{ totalRows: number, data: any[][] }> {
        return await new Promise((resolve, reject) => {
            this.worker!.onmessage = ({ data: { msg, data } }: MessageEvent<PostMessage<WorkerMessageResponses>>) => {
                // if (dev)
                //     console.log(`GUI onmessage: ${JSON.stringify({ msg, data })}`)
                if (msg != 'fetchData')
                    reject(`Recieved unexpected message from web worker (expected 'fetchData', but recieved '${msg}')`)

                resolve(data as MessageResponseFetchData)
            }
            this.postWorkerMessage('fetchData', { filteredColumns, sortedColumns, pagination })
        })
    }
}
