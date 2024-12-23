import type { IColumnMetaData, ICustomStoreOptions, ITableOptions } from '@dtlib/interfaces/Types'

export default class LocalStorageOptions implements ICustomStoreOptions {
  storedOptions: ITableOptions
  storedColumns: IColumnMetaData[] | undefined

  constructor(options: ITableOptions | undefined) {
    // Set standard options
    this.storedOptions = {
      id: undefined,
      currentPage: 1,
      rowsPerPage: 20,
      rowsPerPageOptions: [5, 10, 20, 50, 100],
      actionColumn: false,
      singleSort: false,
      defaultColumnWidth: 200,
    }
    if (options) Object.assign(this.storedOptions, options)
  }

  loadOptions = (id: string): ITableOptions => {
    // If the id is not filled in, it will return the standard options
    this.storedOptions.id = id
    const optionsName = `datatable_${id}_options`
    // Check the settings and apply them to the standard settings
    const storedOptions = localStorage.getItem(optionsName)
    if (storedOptions) Object.assign(this.storedOptions, JSON.parse(storedOptions))
    return this.storedOptions
  }

  loadColumns = (id: string, internalColumns?: IColumnMetaData[]): void | IColumnMetaData[] => {
    const columnsName = `datatable_${id}_columns`
    const storedColumns = localStorage.getItem(columnsName)
    if (storedColumns && internalColumns) {
      const storedInternalColumns: Map<string, IColumnMetaData> = JSON.parse(storedColumns).reduce(
        (acc: Map<string, IColumnMetaData>, cur: IColumnMetaData) => {
          acc.set(cur.id, cur)
          return acc
        },
        new Map<string, IColumnMetaData>(),
      )
      // Check if storedInternalColumns has the column id, if so push it to the stored columns
      this.storedColumns = internalColumns.map((col: IColumnMetaData) => {
        if (storedInternalColumns.has(col.id)) Object.assign(col, storedInternalColumns.get(col.id))
        return col
      })
    }
    return this.storedColumns
  }

  storeOptions = (options: ITableOptions) => {
    const optionsName = `datatable_${this.storedOptions.id}_options`
    if (!this.storedOptions.id) return
    // If the save option is disabled, remove the saved items in the localStorage with the id from the DataTable
    if (options.saveOptions === false) return this.removeFromStorage(optionsName)
    const { dataTypeImpl, saveImpl, ...opts } = options
    localStorage.setItem(optionsName, JSON.stringify(opts))
  }

  storeColumns = (id: string | undefined, saveOptions: boolean | undefined, columns?: IColumnMetaData[]) => {
    const columnsName = `datatable_${id}_columns`
    if (!id) return
    // If the save option is disabled, remove the saved items in the localStorage with the id from the DataTable
    if (saveOptions === false) return this.removeFromStorage(columnsName)
    if (columns) localStorage.setItem(columnsName, JSON.stringify(columns))
  }

  private removeFromStorage(name: string) {
    if (localStorage.getItem(name)) localStorage.removeItem(name)
  }
}
