import { isBrowser, isEqual, logWhenDev } from '../../utils'
import type { IColumnMetaData } from '../../interfaces/Types'
import Options from '../Options.svelte'

export default class ColumnsConfig extends Options {
  // Configure the internalColumns
  async configureColumns(columns: IColumnMetaData[]): Promise<void> {
    const columnsAreEqual = isEqual(columns, this.columns)
    if (columnsAreEqual) return
    this.columns = columns
    await this.loadStoredColumns()
  }

  // Set the internalColumns in the data implementation
  async setInternalColumnsInDataImplementation() {
    if (!this.dataTypeImpl) return
    if (!this.internalColumns) this.internalColumns = await this.dataTypeImpl.setInternalColumns(this.columns)
    else this.internalColumns = await this.dataTypeImpl.setInternalColumns(this.internalColumns)
  }

  async triggerColumnsSave() {
    logWhenDev(`triggerColumnsSave: Storing columns ${this.internalOptions.saveImpl}`)
    if (!isBrowser() || !this.internalOptions.saveImpl) return
    const { id, saveOptions } = this.internalOptions
    this.internalOptions.saveImpl.storeColumns(id, saveOptions, this.internalColumns)
  }

  // Check if there are columns stored in the storage & combine them if needed
  private async loadStoredColumns() {
    logWhenDev('Columns: Gather options from the Save Implementation')
    const { id, saveImpl } = this.internalOptions
    if (!isBrowser() || !saveImpl || !id) return (this.internalColumns = this.columns)
    logWhenDev(`loadStoredColumns: Loading options & columns for ${id}`)
    const columnMetaData = saveImpl.loadColumns(id, this.columns)
    if (columnMetaData) this.internalColumns = columnMetaData
    else this.internalColumns = this.columns
  }
}
