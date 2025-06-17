import { fromCSV, loadJSON, table } from 'arquero'
import type { MessageRequestLoadFile } from '../workers/messages'

export default class Arquero {
  dt: any | undefined
  tempDt: any | undefined

  async loadFile(data: MessageRequestLoadFile) {
    this.tempDt = undefined
    if (data.extension === 'csv') this.dt = await this.loadCSVFile(data.url)
    else if (data.extension === 'json') this.dt = await loadJSON(data.url, {})
    else throw new Error(`Unknown extension '${data.extension}'`)
  }

  private async loadCSVFile(url: string) {
    // Get the file content as string
    const response = await fetch(url)
    const csvText = await response.text()

    // Check the number of lines and if it's <= 1, then there is only a header, but no rows
    const lines = csvText.trim().split('\n')
    if (lines.length > 1) return fromCSV(csvText)

    // There are no rows so extract the columns and create the empty table
    const headerLine = lines[0] || '';
    const columns = headerLine.split(',').map(c => c.trim());
    const emptyCols = Object.fromEntries(columns.map(col => [col, []]));
    return table(emptyCols);
  }
}
