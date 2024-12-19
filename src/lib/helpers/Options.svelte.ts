import Config from './Config'
import { isBrowser, isEqual, logWhenDev } from '../utils'
import type { ITableOptions } from '../interfaces/Types'
import Base from './Base.svelte'

export default class Options extends Base {
  // Configure the internalOptions
  async configureOptions(options: ITableOptions | undefined): Promise<void> {
    const optionsAreEqual = isEqual(options, this.options) && this.options !== undefined
    if (optionsAreEqual && this.internalOptionsSet) return await this.loadSaveImplementation()
    this.options = options
    Object.assign(this.internalOptions, this.options ?? Config.defaultOptions)
    const saveOptions = this.internalOptions.saveOptions !== false || this.options?.saveOptions !== false
    if (!isEqual(this.internalOptions, this.options) && saveOptions) await this.loadStoredOptions()
    this.internalOptionsSet = true
    await this.loadSaveImplementation()
  }

  async updateTotalRows(totalRows: number) {
    this.internalOptions.totalRows = totalRows
  }

  async triggerOptionsSave() {
    logWhenDev(`triggerOptionsSave: Storing options ${this.internalOptions.saveImpl}`)
    if (!isBrowser() || !this.internalOptions.saveImpl) return
    this.internalOptions.saveImpl.storeOptions(this.internalOptions)
  }

  // If the options & internalOptions are not equal, combine them or fetch from the storage
  private async loadStoredOptions() {
    logWhenDev('Options: Gather options from the Save Implementation')
    const id = this.options?.id ?? this.internalOptions.id
    if (!isBrowser() || !this.internalOptions?.saveImpl || !id) return Object.assign(this.internalOptions, this.options ?? Config.defaultOptions)
    console.log("AFTER LOAD ", this.internalOptions?.actionColumn)
    logWhenDev(`loadStoredOptions: Loading options & columns for ${id}`)
    const tableOptions = this.internalOptions.saveImpl.loadOptions(id)
    if (tableOptions) Object.assign(this.internalOptions, tableOptions)
    else if (!this.options) Object.assign(this.internalOptions, this.options)
  }

  // Configure the save options implementation
  private async loadSaveImplementation() {
    if (this.internalOptions.saveImpl || !isBrowser()) return
    if (this.options?.saveImpl) {
      this.internalOptions.saveImpl = this.options.saveImpl
      return
    }
    await import('../helpers/LocalstorageClass').then(({ default: LocalStorageOptions }) => {
      this.internalOptions.saveImpl = new LocalStorageOptions(this.internalOptions)
    })
  }
}