import { BROWSER } from 'esm-env'

export default class Reader {
    static async readFileAsText(file: File, encoding?: string): Promise<string | null> {
        return new Promise(resolve => {
            if(!BROWSER) return
            const reader = new FileReader()
            reader.onload = function (this: FileReader) {
                if (!this.result) return resolve(null)
                return resolve(this.result.toString())
            }
            reader.readAsText(file, encoding)
        })
    }
}