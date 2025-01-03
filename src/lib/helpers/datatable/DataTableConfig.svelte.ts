import { logWhenDev } from '../../utils'
import Pagination from '../../helpers/Pagination'

export default class DataTableConfig extends Pagination {
  constructor() {
    super()
    $effect(() => {
      if (this.initialisationCompleted && this.options && this.reactiveTrigger) this.init()
    })
    $effect(() => {
      if (this.initialisationCompleted && this.data && this.reactiveTrigger) this.init(true)
    })
    $effect(() => {
      if (this.initialisationCompleted && this.columns && this.reactiveTrigger) this.init(true)
    })
  }

  async init(reconfigureData: boolean = false) {
    this.renderStatus = 'initializing'
    logWhenDev(`DataTable: init ${this.options?.id}`)
    await this.configureOptions(this.options)
    await this.configureColumns(this.columns ?? [])
    if (!this.initialisationCompleted) {
      const validData = await this.configureData({ data: this.data, modifyColumnMetadata: this.modifyColumnMetadata }, reconfigureData)
      if (!validData) throw new Error('Invalid format, make sure the format is not ASCII & not UTF8 encoded');
    }
    await this.setInternalColumnsInDataImplementation()
    await this.render()
    if (this.initialized) this.initialized()
  }

  async render(onlyPaginationChanged: boolean = false) {
    this.renderStatus = 'rendering'
    if (this.rendering) await this.rendering()
    logWhenDev('DataTable: render')
    if (!this.dataTypeImpl) return
    const { renderedData, originalIndices, totalRows, internalColumns } = await this.dataTypeImpl!.render(onlyPaginationChanged)
    this.internalColumns = internalColumns
    this.renderedData = renderedData ?? []
    this.originalIndices = originalIndices
    await this.updateTotalRows(totalRows ?? 0)
    this.renderStatus = 'completed'
    if (this.rendered) this.rendered()
  }

  async updateVariables(variables: Record<string, any>) {
    for (const [key, value] of Object.entries(variables)) {
      if (key === 'disabled') this.disabled = value ?? false
      else (this as Record<string, any>)[key] = value
    }
  }

  async destroy() {
    if (!this.dataTypeImpl) return
    await this.dataTypeImpl.destroy()
  }
}
