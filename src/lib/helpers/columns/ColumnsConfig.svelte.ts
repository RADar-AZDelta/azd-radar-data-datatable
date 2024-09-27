import { isBrowser, isEqual, logWhenDev } from '../../utils'
import type { IColumnMetaData } from '../../interfaces/Types'
import options from '../Options.svelte'
import dataClass from '../data/Data.svelte'

export default class ColumnsConfig {
  internalColumns = $state<IColumnMetaData[] | undefined>()
  columns = $state<IColumnMetaData[] | undefined>()
  visibleOrderedColumns = $derived(this.internalColumns?.filter(col => col.visible !== false).sort((a, b) => a.position! - b.position!))

  // Configure the internalColumns
  async configureColumns(columns: IColumnMetaData[]): Promise<void> {
    console.log('CONFIGURE COLUMNS')
    const columnsAreEqual = isEqual(columns, this.columns)
    if (columnsAreEqual) return
    this.columns = columns
    await this.loadStoredColumns()
  }

  // Set the internalColumns in the data implementation
  async setInternalColumnsInDataImplementation() {
    if (!dataClass.dataTypeImpl) return
    if (!this.internalColumns) this.internalColumns = await dataClass.dataTypeImpl.setInternalColumns(this.columns)
    else this.internalColumns = await dataClass.dataTypeImpl.setInternalColumns(this.internalColumns)
  }

  async triggerColumnsSave() {
    logWhenDev(`triggerColumnsSave: Storing columns ${options.internalOptions.saveImpl}`)
    if (!isBrowser() || !options.internalOptions.saveImpl) return
    const { id, saveOptions } = options.internalOptions
    options.internalOptions.saveImpl.storeColumns(id, saveOptions, this.internalColumns)
  }

  // Check if there are columns stored in the storage & combine them if needed
  private async loadStoredColumns() {
    logWhenDev('Columns: Gather options from the Save Implementation')
    const { id, saveImpl } = options.internalOptions
    if (!isBrowser() || !saveImpl || !id) return (this.internalColumns = this.columns)
    logWhenDev(`loadStoredColumns: Loading options & columns for ${id}`)
    const columnMetaData = saveImpl.loadColumns(id, this.columns)
    if (columnMetaData) this.internalColumns = columnMetaData
    else this.internalColumns = this.columns
  }
}
