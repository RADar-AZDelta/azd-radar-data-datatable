import type { IColumnMetaData, ICustomStoreOptions, ITableOptions, IStoredOptions } from '$lib/interfaces/Types'

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

  load = (id: string, internalColumns?: IColumnMetaData[]): IStoredOptions => {
    // If the id is not filled in, it will return the standard options
    this.storedOptions.id = id
    const optionsName = `datatable_${id}_options`
    const columnsName = `datatable_${id}_columns`
    // Check the settings and apply them to the standard settings
    const storedOptions = localStorage.getItem(optionsName)
    if (storedOptions) Object.assign(this.storedOptions, JSON.parse(storedOptions))
    // Check the stored columns settings and apply them to the current columns
    const storedColumns = localStorage.getItem(columnsName)
    if (storedColumns && internalColumns) {
      const storedInternalColumns: Map<string, IColumnMetaData> = JSON.parse(storedColumns).reduce(
        (acc: Map<string, IColumnMetaData>, cur: IColumnMetaData) => {
          acc.set(cur.id, cur)
          return acc
        },
        new Map<string, IColumnMetaData>()
      )
      // Check if storedInternalColumns has the column id, if so push it to the stored columns
      this.storedColumns = internalColumns.map((col: IColumnMetaData) => {
        if (storedInternalColumns.has(col.id)) Object.assign(col, storedInternalColumns.get(col.id))
        return col
      })
    }
    return { tableOptions: this.storedOptions, columnMetaData: this.storedColumns }
  }

  store = (options: ITableOptions, columns: IColumnMetaData[] | undefined): void => {
    const optionsName = `datatable_${this.storedOptions.id}_options`
    const columnsName = `datatable_${this.storedOptions.id}_columns`
    // If the save option is disabled, remove the saved items in the localStorage with the id from the DataTable
    if (options.saveOptions === false) return this.removeFromStorage(optionsName, columnsName)
    if (!this.storedOptions.id) return
    // Save the options and the columns in the localStorage
    const { dataTypeImpl, saveImpl, ...opts } = options
    localStorage.setItem(optionsName, JSON.stringify(opts))
    if (columns) localStorage.setItem(columnsName, JSON.stringify(columns))
  }

  private removeFromStorage(optionsName: string, columnsName: string) {
    if (localStorage.getItem(optionsName)) localStorage.removeItem(optionsName)
    if (localStorage.getItem(columnsName)) localStorage.removeItem(columnsName)
  }
}
