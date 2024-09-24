import { logWhenDev } from '../../utils'
import optionsClass from '../Options.svelte'
import dataClass from '../data/Data.svelte'
import columnsClass from '../columns/Columns.svelte'
import type { FetchDataFunc, IColumnMetaData, ITableOptions, ModifyColumnMetadataFunc } from '../../interfaces/Types'

export default class DataTableConfig {
  data = $state<any[] | any[][] | FetchDataFunc | File>()
  columns = $state<IColumnMetaData[] | undefined>()
  options = $state<ITableOptions>()
  initialisationCompleted = $state<boolean>(false)
  reactiveTrigger: boolean = false
  renderStatus = $state<string>('')
  rendering: undefined | Function = undefined
  rendered: Function | undefined = undefined
  initialized: Function | undefined = undefined
  modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined

  constructor() {
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
    await optionsClass.configureOptions(this.options)
    await columnsClass.configureColumns(this.columns ?? [])
    if (!this.initialisationCompleted) await dataClass.configureData({ data: this.data, modifyColumnMetadata: this.modifyColumnMetadata }, reconfigureData)
    await columnsClass.setInternalColumnsInDataImplementation()
    await this.render()
    if (this.initialized) this.initialized()
  }

  async render(onlyPaginationChanged: boolean = false) {
    this.renderStatus = 'rendering'
    if (this.rendering) await this.rendering()
    logWhenDev('DataTable: render')
    if (!dataClass.dataTypeImpl) return
    const { renderedData, originalIndices, totalRows, internalColumns } = await dataClass.dataTypeImpl!.render(onlyPaginationChanged)
    columnsClass.internalColumns = internalColumns
    dataClass.renderedData = renderedData
    dataClass.originalIndices = originalIndices
    await optionsClass.updateTotalRows(totalRows ?? 0)
    this.renderStatus = 'completed'
    if (this.rendered) this.rendered()
  }

  async updateVariables(variables: Record<string, any>) {
    for (let [key, value] of Object.entries(variables)) {
      if (key === 'disabled') optionsClass.disabled = value ?? false
      else (this as Record<string, any>)[key] = value
    }
  }

  async destroy() {
    if (!dataClass.dataTypeImpl) return
    await dataClass.dataTypeImpl.destroy()
  }
}
