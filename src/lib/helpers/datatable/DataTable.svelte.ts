import DataTableConfig from '@dtlib/helpers/datatable/DataTableConfig.svelte'
import type { IColumnMetaData, SortDirection, TFilter } from '@dtlib/interfaces/Types'

export default class DataTable extends DataTableConfig {
  constructor() {
    super()
  }

  saveToFile = async () => await this.dataTypeImpl?.saveToFile()
  getBlob = async () => await this.dataTypeImpl?.getBlob()
  getData = () => this.dataTypeImpl?.data
  getColumns = () => this.internalColumns
  setDisabled = (value: boolean) => (this.disabled = value)
  updateColumns = async (cols: IColumnMetaData[]) => await this._updateColumns(cols)
  updateColumnFilter = async (columnId: string, filter: TFilter) => await this._updateColumnFilter(columnId, filter).then(async () => await this.render())
  changeColumnSort = async (columnId: string, sortDirection: SortDirection) =>
    await this._changeColumnSort(columnId, sortDirection).then(async () => await this.render())
  executeQueryAndReturnResults = async (query: object) => await this.dataTypeImpl?.executeQueryAndReturnResults(query)
  executeExpressionsAndReturnResults = async (expressions: Record<string, any>) => await this.dataTypeImpl?.executeExpressionsAndReturnResults(expressions)
  getTablePagination = () => this._getTablePagination()
  changePagination = async (pag: { currentPage?: number; rowsPerPage?: number }) => await this._changePagination(pag).then(async () => await this.render())
  onPaginationChanged = async (rowsPerPage: number, currentPage: number) =>
    await this._onPaginationChanged(rowsPerPage, currentPage).then(async () => await this.render())
  replaceValuesOfColumn = async (currentValue: any, updatedValue: any, column: string) =>
    await this.dataTypeImpl?.replaceValuesOfColumn(currentValue, updatedValue, column)

  async updateRows(rowsToUpdateByOriginalIndex: Map<number, Record<string, any>>) {
    await this.dataTypeImpl?.updateRows(rowsToUpdateByOriginalIndex)
    for (const [originalIndex, row] of rowsToUpdateByOriginalIndex) await this.updateRow(originalIndex, row)
  }

  private async updateRow(originalIndex: number, row: Record<string, any>) {
    const renderedIndex = (this.originalIndices ?? []).findIndex(i => i === originalIndex)
    if (renderedIndex < 0) return
    const renderedRow = (this.renderedData as any[])[renderedIndex]
    for (const [column, value] of Object.entries(row)) renderedRow[column] = value
  }

  async insertRows(rows: Record<string, any>[]) {
    const indices = await this.dataTypeImpl?.insertRows(rows)
    if (typeof indices == 'number') this.originalIndices = indices
    await this.render()
    return this.originalIndices
  }

  async deleteRows(originalIndices: number[]) {
    await this.dataTypeImpl?.deleteRows(originalIndices)
    await this.render()
  }

  async getFullRow(originalIndex: number) {
    const fullRow = await this.dataTypeImpl?.getFullRow(originalIndex)
    if (!fullRow) throw new Error('Getting the full row did not work. Are you using a supported data method?')
    return fullRow
  }

  async getNextRow(currentIndex: number) {
    const { rowsPerPage, currentPage } = this.getTablePagination()
    return await this.dataTypeImpl?.getNextRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  async getPreviousRow(currentIndex: number) {
    const { rowsPerPage, currentPage } = this.getTablePagination()
    return await this.dataTypeImpl?.getPreviousRow(currentIndex, rowsPerPage ?? 0, currentPage ?? 0)
  }

  async insertColumns(cols: IColumnMetaData[]) {
    const updatedColumns = await this.dataTypeImpl?.insertColumns(cols)
    if (updatedColumns) this.internalColumns = updatedColumns
    await this.render()
  }

  async renameColumns(columns: Record<string, string>) {
    await this.dataTypeImpl?.renameColumns(columns)
    await this.render()
  }

  async triggerOptionsAndColumnsSave() {
    await this.triggerOptionsSave()
    await this.triggerColumnsSave()
  }
}
