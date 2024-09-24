import { BROWSER } from 'esm-env'
import Config from './Config'
import { isEqual, logWhenDev } from '../utils'
import type { ITableOptions } from '../interfaces/Types'

class Options {
  internalOptions = $state<ITableOptions>(Config.defaultOptions)
  options = $state<ITableOptions>()
  disabled = $state<boolean>(false)

  // Configure the internalOptions
  async configureOptions(options: ITableOptions | undefined): Promise<void> {
    await this.loadSaveImplementation()
    const optionsAreEqual = isEqual(options, this.options) && this.options !== undefined
    if (optionsAreEqual) return
    this.options = options
    this.internalOptions = options ?? Config.defaultOptions
    const saveOptions = this.internalOptions.saveOptions !== false || this.options?.saveOptions !== false
    if (!isEqual(this.internalOptions, this.options) && saveOptions) await this.loadStoredOptions()
  }

  async updateTotalRows(totalRows: number) {
    this.internalOptions.totalRows = totalRows
  }

  async triggerOptionsSave() {
    logWhenDev(`triggerOptionsSave: Storing options ${this.internalOptions.saveImpl}`)
    if (!BROWSER || !this.internalOptions.saveImpl) return
    this.internalOptions.saveImpl.storeOptions(this.internalOptions)
  }

  // If the options & internalOptions are not equal, combine them or fetch from the storage
  private async loadStoredOptions() {
    logWhenDev('Options: Gather options from the Save Implementation')
    const id = this.options?.id ?? this.internalOptions.id
    if (!BROWSER || !this.internalOptions?.saveImpl || !id) return (this.internalOptions = this.options ?? Config.defaultOptions)
    logWhenDev(`loadStoredOptions: Loading options & columns for ${id}`)
    const tableOptions = this.internalOptions.saveImpl.loadOptions(id)
    if (tableOptions) Object.assign(this.internalOptions, tableOptions)
    else if (!this.options) Object.assign(this.internalOptions, this.options)
  }

  // Configure the save options implementation
  private async loadSaveImplementation() {
    if (!this.internalOptions.saveImpl || !BROWSER) return
    if (this.options?.saveImpl) return (this.internalOptions.saveImpl = this.options.saveImpl)
    await import('../helpers/LocalstorageClass').then(({ default: LocalStorageOptions }) => {
      this.internalOptions.saveImpl = new LocalStorageOptions(this.internalOptions)
    })
  }
}

const options = new Options()
export default options
