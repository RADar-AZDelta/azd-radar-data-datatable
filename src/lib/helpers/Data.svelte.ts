import type { FetchDataFunc, IDataTypeFunctionalities, IDataTypeInfo } from "../interfaces/Types"
import { DataTypeFile } from "./DataTypeFile"
import { DataTypeMatrix } from './DataTypeMatrix'
import { DataTypeArrayOfObjects } from './DataTypeArrayOfObjects'
import optionsClass from './Options.svelte'
import columnsClass from './columns/Columns.svelte'

// TODO: implement state back

class Data {
    data = $state<any[] | any[][] | FetchDataFunc | File>()
    renderedData = $state<any[] | any[][]>()
    originalIndices = $state<number[]>()
    dataTypeImpl = $state<IDataTypeFunctionalities | undefined>()
    // data: any[] | any[][] | FetchDataFunc | File
    // renderedData: any[] | any[][]
    // originalIndices: number[]
    // dataTypeImpl: IDataTypeFunctionalities | undefined

    // Configure the data implementation
    async configureData(setDataOptions: IDataTypeInfo, reconfigure: boolean = false) {
        if (this.dataTypeImpl && !reconfigure) return
        const { data } = setDataOptions
        if (optionsClass.internalOptions.dataTypeImpl) await this.setDataTypeImplFromOptions()
        else if (data instanceof File) await this.setDataTypeImplForFile()
        else if (Array.isArray(data) && data.length && Array.isArray(data[0])) await this.setDataTypeImplForMatrix()
        else if (Array.isArray(data) && data.length && typeof data[0] === 'object') await this.setDataTypeImplForArrayOfObjects()
        await this.setDataViaImplementation(setDataOptions)
    }

    private async setDataTypeImplFromOptions() {
        if (!this.dataTypeImpl) this.dataTypeImpl = optionsClass.internalOptions.dataTypeImpl
    }

    private async setDataTypeImplForFile() {
        if (!this.dataTypeImpl) this.dataTypeImpl = new DataTypeFile()
    }

    private async setDataTypeImplForMatrix() {
        if (!this.dataTypeImpl) this.dataTypeImpl = new DataTypeMatrix()
    }

    private async setDataTypeImplForArrayOfObjects() {
        if (!this.dataTypeImpl) this.dataTypeImpl = new DataTypeArrayOfObjects()
    }

    private async setDataViaImplementation(setDataOptions: IDataTypeInfo) {
        if (!this.dataTypeImpl) return
        await this.dataTypeImpl.setData({...setDataOptions, internalOptions: optionsClass.internalOptions, internalColumns: columnsClass.internalColumns})
    }
}

const data = new Data()
export default data