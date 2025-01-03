import { browser } from '$app/environment'

export default class Reader {
    private static reader = browser ? new FileReader() : undefined

    static async readFileAsText(file: File): Promise<string | null> {
        return new Promise(resolve => {
            if (!this.reader) return resolve(null)
            this.reader.onload = function (this: FileReader) {
                if (!this.result) return resolve(null)
                return resolve(this.result.toString())
            }
            this.reader.readAsText(file)
        })
    }

    static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null> {
        return new Promise(resolve => {
            if (!this.reader) return resolve(null)
            this.reader.onload = function (this: FileReader) {
                if (!this.result) return resolve(null)
                return resolve(this.result as ArrayBuffer)
            }
            this.reader.readAsArrayBuffer(file)
        })
    }
}