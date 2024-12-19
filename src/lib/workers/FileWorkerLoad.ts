import { loadCSV, loadJSON } from 'arquero'
import type Table from 'arquero/dist/types/table/table'
import type { MessageRequestLoadFile } from '@dtlib/workers/messages'

export default class Arquero {
  dt: Table | undefined
  tempDt: Table | undefined

  async loadFile(data: MessageRequestLoadFile) {
    this.tempDt = undefined
    if (data.extension === 'csv') this.dt = await loadCSV(data.url, {})
    else if (data.extension === 'json') this.dt = await loadJSON(data.url, {})
    else throw new Error(`Unknown extension '${data.extension}'`)
  }
}