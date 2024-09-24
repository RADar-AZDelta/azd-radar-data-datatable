import { logWhenDev } from "../../utils"
import optionsClass from "../Options.svelte"
import dataClass from '../Data.svelte'
import columnsClass from '../columns/Columns.svelte'
import type { FetchDataFunc, IColumnMetaData, ITableOptions, ModifyColumnMetadataFunc } from "../../interfaces/Types"

// TODO: implement state back

export default class DataTableConfig {
    data = $state<any[] | any[][] | FetchDataFunc | File>()
    columns = $state<IColumnMetaData[] | undefined>()
    options = $state<ITableOptions>()
    initialisationCompleted = $state<boolean>(false)
    // initialisationCompleted: boolean = false
    reactiveTrigger: boolean = false
    renderStatus = $state<string>('')
    // renderStatus: string = ''
    rendering: undefined | Function = undefined
    rendered: Function | undefined = undefined
    initialized: Function | undefined = undefined
    modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined

    constructor() {
        $effect(() => {
            if (this.initialisationCompleted && this.options && this.reactiveTrigger) {
                console.log("INIT NOW")
                this.init()
            }
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
        console.log("RENDER NOW!")
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
        console.log("RENDERED DATA ", renderedData)
        dataClass.renderedData = renderedData
        dataClass.originalIndices = originalIndices
        await optionsClass.updateTotalRows(totalRows ?? 0)
        this.renderStatus = 'completed'
        if (this.rendered) this.rendered()
    }

    async updateVariables(variables: Record<string, any>) {
        for (let [key, value] of Object.entries(variables)) (this as Record<string, any>)[key] = value
    }
}