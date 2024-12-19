import Fetch from '@dtlib/workers/FileWorkerFetch'
import type { MessageRequestGetBlob, MessageRequestSaveToFile } from '@dtlib/workers/messages'

export default class Save extends Fetch {
  async saveToFile({ fileHandle, options }: MessageRequestSaveToFile) {
    const extension = fileHandle.name.split('.').pop()
    if (extension === 'csv') return await this.exportCSV({ fileHandle, options })
    throw new Error(`Unknown or not yet implemented export file extension: '${extension}'`)
  }

  async getBlob({ extension, options }: MessageRequestGetBlob) {
    if (extension === 'csv') return await this.createBlobCSV(options)
    throw new Error(`Unknown or not yet implemented export file extension: '${extension}'`)
  }

  private async exportCSV({ fileHandle, options }: MessageRequestSaveToFile) {
    const writable = await fileHandle.createWritable()
    const { names, delim, reFormat, buffer } = await this.getBlobInfo(options)
    const header = await this.createCSVHeader(names, delim, reFormat)
    await writable.write(header.join(''))
    const body = await this.createCSVBody(names, delim, reFormat, buffer, writable)
    await writable.write(body.join(''))
    await writable.close()
  }

  private async createBlobCSV(options?: any) {
    const { names, delim, reFormat } = await this.getBlobInfo(options)
    const header = await this.createCSVHeader(names, delim, reFormat)
    const body = await this.createCSVBody(names, delim, reFormat)
    const buffer = [...header, ...body]
    return buffer
  }

  private formatCSVValue(value: Date | number | string | null | undefined, reFormat: RegExp) {
    if (!value && value !== 0) return ''
    else if (value instanceof Date) return value.toISOString()
    else if (reFormat.test((value += ''))) return '"' + value.toString().replace(/"/g, '""') + '"'
    return value
  }

  private async createCSVHeader(names: string[], delimiter: string, reFormat: RegExp) {
    const header = []
    const cells = names.map(name => this.formatCSVValue(name, reFormat))
    header.push(cells.join(delimiter) + '\n')
    return header
  }

  private async createCSVBody(names: string[], delim: string, reFormat: RegExp, buffer?: number, writable?: FileSystemWritableFileStream) {
    let body = []
    if (!this.dt) return []
    for (let rowIndex = 0; rowIndex < this.dt.totalRows(); rowIndex++) {
      if (buffer && writable && rowIndex % buffer === 0) {
        await writable.write(body.join(''))
        body = []
      }
      const cells = names.map(col => this.formatCSVValue(this.dt!.get(col, rowIndex), reFormat))
      body.push(cells.join(delim) + '\n')
    }
    return body
  }

  private async getBlobInfo(options?: any) {
    const names: string[] = options?.columns || this.dt?.columnNames()
    const delim = options?.delimiter || ','
    const reFormat = new RegExp(`["${delim}\n\r]`)
    const buffer = options?.bufferRowSize || 5000
    return { names, delim, reFormat, buffer }
  }
}
