import Columns from '@dtlib/helpers/columns/Columns.svelte'
import { DataTypeFile } from '@dtlib/helpers/data/dataTypes/DataTypeFile'
import { DataTypeMatrix } from '@dtlib/helpers/data/dataTypes/DataTypeMatrix'
import { DataTypeArrayOfObjects } from '@dtlib/helpers/data/dataTypes/DataTypeArrayOfObjects'
import type { IDataTypeInfo } from '@dtlib/interfaces/Types'

export default class Data extends Columns {
  // Configure the data implementation
  async configureData(setDataOptions: IDataTypeInfo, reconfigure: boolean = false) {
    if (this.dataTypeImpl && !reconfigure) return
    const { data } = setDataOptions
    if (this.internalOptions.dataTypeImpl) await this.setDataTypeImplFromOptions()
    else if (data instanceof File) await this.setDataTypeImplForFile()
    else if (Array.isArray(data) && data.length && Array.isArray(data[0])) await this.setDataTypeImplForMatrix()
    else if (Array.isArray(data) && data.length && typeof data[0] === 'object') await this.setDataTypeImplForArrayOfObjects()
    await this.setDataViaImplementation(setDataOptions)
  }

  private async setDataTypeImplFromOptions() {
    if (!this.dataTypeImpl) this.dataTypeImpl = this.internalOptions.dataTypeImpl
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
    await this.dataTypeImpl.setData({ ...setDataOptions, internalOptions: this.internalOptions, internalColumns: this.internalColumns })
  }
}