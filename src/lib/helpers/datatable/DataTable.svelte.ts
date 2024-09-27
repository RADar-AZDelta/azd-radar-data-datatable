import DataTableConfig from './DataTableConfig.svelte'
import data from '../data/Data.svelte'
import columns from '../columns/Columns.svelte'
import options from '../Options.svelte'
import pagination from '../Pagination'
import type { IColumnMetaData } from '../../interfaces/Types'
import type Query from 'arquero/dist/types/query/query'

export default class DataTable extends DataTableConfig {
  saveToFile = async () => await data.dataTypeImpl?.saveToFile()
  getBlob = async () => await data.dataTypeImpl?.getBlob()
  getData = () => data.dataTypeImpl?.data
  getColumns = () => columns.internalColumns
  setDisabled = (value: boolean) => (options.disabled = value)
  updateColumns = async (cols: IColumnMetaData[]) => await columns.updateColumns(cols)
  executeQueryAndReturnResults = async (query: Query | object) => await data.dataTypeImpl?.executeQueryAndReturnResults(query)
  executeExpressionsAndReturnResults = async (expressions: Record<string, any>) => await data.dataTypeImpl?.executeExpressionsAndReturnResults(expressions)
  getTablePagination = () => pagination.getTablePagination()
  changePagination = async (pag: { currentPage?: number; rowsPerPage?: number }) => await pagination.changePagination(pag)
  replaceValuesOfColumn = async (currentValue: any, updatedValue: any, column: string) =>
    await data.dataTypeImpl?.replaceValuesOfColumn(currentValue, updatedValue, column)

  constructor() {
    super()
  }

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>) {
    await data.dataTypeImpl?.updateRows(rowsToUpdateByOriginalIndex)
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) await this.updateRow(originalIndex, row)
  }

  private async updateRow(originalIndex: number, row: Record<string, any>) {
    const renderedIndex = (data.originalIndices ?? []).findIndex(i => i === originalIndex)
    if (renderedIndex < 0) return
    const renderedRow = (data.renderedData as any[])[renderedIndex]
    for (const [column, value] of Object.entries(row)) renderedRow[column] = value
  }

  async insertRows(rows: Record<string, any>[]) {
    const indices = await data.dataTypeImpl?.insertRows(rows)
    if (typeof indices == 'number') data.originalIndices = indices
    await this.render()
    return data.originalIndices
  }

  async deleteRows(originalIndices: number[]) {
    await data.dataTypeImpl?.deleteRows(originalIndices)
    await this.render()
  }

  async getFullRow(originalIndex: number) {
    const fullRow = await data.dataTypeImpl?.getFullRow(originalIndex)
    if (!fullRow) throw new Error('Getting the full row did not work. Are you using a supported data method?')
    return fullRow
  }

  async getNextRow(currentIndex: number) {
    const { rowsPerPage, currentPage } = pagination.getTablePagination()
    return await data.dataTypeImpl?.getNextRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  async getPreviousRow(currentIndex: number) {
    const { rowsPerPage, currentPage } = pagination.getTablePagination()
    return await data.dataTypeImpl?.getPreviousRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  async insertColumns(cols: IColumnMetaData[]) {
    const updatedColumns = await data.dataTypeImpl?.insertColumns(cols)
    if (updatedColumns) columns.internalColumns = updatedColumns
    await this.render()
  }

  async renameColumns(columns: Record<string, string>) {
    await data.dataTypeImpl?.renameColumns(columns)
    await this.render()
  }

  async triggerOptionsAndColumnsSave() {
    debugger
    await options.triggerOptionsSave()
    await columns.triggerColumnsSave()
  }
}