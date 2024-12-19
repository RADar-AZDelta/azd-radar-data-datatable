import { from, fromJSON } from 'arquero'
import Save from '@dtlib/workers/FileWorkerSave'
import type {
  MessageRequestChangeRow,
  MessageRequestDeleteRows,
  MessageRequestGetRow,
  MessageRequestInsertColumns,
  MessageRequestInsertRows,
  MessageRequestReplaceValuesOfColumn,
  MessageRequestUpdateRows,
} from '@dtlib/workers/messages'
import type Column from 'arquero/dist/types/table/column'
import type { TableData } from 'arquero/dist/types/table/table'

export default class Crud extends Save {
  insertRows({ rows }: MessageRequestInsertRows) {
    if (!this.dt) return
    this.tempDt = undefined
    const indices: number[] = Array.from({ length: rows.length }, (_, i) => this.dt!._total + i)
    this.dt = this.dt.concat(from(rows))
    return indices
  }

  async insertColumns({ columns }: MessageRequestInsertColumns) {
    if (!this.dt) return
    const obj: Record<string, any> = {}
    // Add a column that is already in the original table
    obj[this.dt._names[0]] = [this.dt._data[this.dt._names[0]].data[0]]
    // Add a new column name with an empty array as values in every row
    for (const col of columns) obj[col.id] = [undefined]
    // Left join the new table into the original table
    this.dt = this.dt.join_left(fromJSON(obj))
  }

  getRow = ({ index }: MessageRequestGetRow) => this.dt?.object(index)

  async getNextRow({ index, rowsPerPage, currentPage }: MessageRequestChangeRow) {
    if (!this.tempDt) return
    const currentIndicesIndex = this.tempDt._index.indexOf(index)
    const indicesIndex = this.tempDt._index[currentIndicesIndex + 1]
    let newPage: number = currentPage
    if (indicesIndex % rowsPerPage === 0) newPage++
    const row = this.dt?.object(indicesIndex)
    return { row, index: indicesIndex, page: newPage }
  }

  async getPreviousRow({ index, rowsPerPage, currentPage }: MessageRequestChangeRow) {
    if (!this.tempDt) return
    const currentIndicesIndex = this.tempDt._index.indexOf(index)
    const indicesIndex = this.tempDt._index[currentIndicesIndex > 0 ? currentIndicesIndex - 1 : 0]
    let newPage: number = currentPage
    if ((indicesIndex + 1) % rowsPerPage === 0) newPage--
    const row = this.dt?.object(indicesIndex)
    return { row, index: indicesIndex, page: newPage }
  }

  async updateRows({ rowsByIndex }: MessageRequestUpdateRows) {
    for (const [index, row] of rowsByIndex)
      for (const [column, value] of Object.entries(row)) if (this.dt?._data[column]) this.dt._data[column].data[index] = value
  }

  async replaceValuesOfColumn({ currentValue, updatedValue, column }: MessageRequestReplaceValuesOfColumn) {
    this.dt?.scan((row?: number | undefined, data?: TableData | undefined) => {
      if (!data || row === undefined || row === null) return
      const value = (<Record<string, any>>data)[column].data[row]
      if (value === currentValue) (<Record<string, any>>data)[column].data[row] = updatedValue
    })
  }

  async deleteRows({ indices }: MessageRequestDeleteRows) {
    this.tempDt = undefined
    indices.sort((a, b) => b - a) //sort descending

    for (const index of indices) {
      for (const column of Object.keys(this.dt?._data)) (this.dt?._data[column] as Column).data.splice(index, 1)
      this.dt!._total -= 1
      this.dt!._nrows -= 1
    }
  }
}
