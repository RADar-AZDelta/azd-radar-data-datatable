import type { IColumnMetaData, IStoreOptions, ITableOptions, loadStore } from '../components/DataTable'

export class localStorageOptions implements IStoreOptions {
  storedOptions: ITableOptions
  storedColumns: IColumnMetaData[] | undefined

  constructor(options: ITableOptions | undefined) {
    // Set standard options
    if (options) {
      this.storedOptions = options
    } else
      this.storedOptions = {
        id: undefined,
        currentPage: 1,
        rowsPerPage: 20,
        rowsPerPageOptions: [5, 10, 20, 50, 100],
        actionColumn: false,
        singleSort: false,
        defaultColumnWidth: 200,
      }
  }

  load = (internalOptions: ITableOptions, internalColumns: IColumnMetaData[] | undefined): loadStore => {
    // If the id is not filled in, it will return the standard options
    this.storedOptions = internalOptions
    if (!internalOptions.id) return { savedOptions: this.storedOptions, savedColumns: this.storedColumns }

    // Check the settings and apply them to the standard settings
    const storedOptions = localStorage.getItem(`datatable_${internalOptions.id}_options`)
    if (storedOptions) Object.assign(this.storedOptions, JSON.parse(storedOptions))

    // Check the stored columns settings and apply them to the current columns
    const storedColumns = localStorage.getItem(`datatable_${internalOptions.id}_columns`)
    if (storedColumns) {
      const storedInternalColumns: Map<string, IColumnMetaData> = JSON.parse(storedColumns).reduce(
        (acc: Map<string, IColumnMetaData>, cur: IColumnMetaData) => {
          acc.set(cur.id, cur)
          return acc
        },
        new Map<string, IColumnMetaData>()
      )
      this.storedColumns = internalColumns?.map((col: IColumnMetaData) => {
        if (storedInternalColumns.has(col.id)) Object.assign(col, storedInternalColumns.get(col.id))
        return col
      })
    }

    return { savedOptions: this.storedOptions, savedColumns: this.storedColumns }
  }

  store = (options: ITableOptions, columns: IColumnMetaData[] | undefined): void => {
    // If it is allowed to save the options
    if (options.saveOptions == undefined || options.saveOptions == true) {
      // If there is no id given, exit the method
      if (!this.storedOptions.id) return
      // Save the options and the columns in the localStorage
      localStorage.setItem(`datatable_${this.storedOptions.id}_options`, JSON.stringify(options))
      if (columns) localStorage.setItem(`datatable_${this.storedOptions.id}_columns`, JSON.stringify(columns))
    } else {
      // If the save option is disabled, remove the saved items in the localStorage with the id from the DataTable
      if (localStorage.getItem(`datatable_${this.storedOptions.id}_options`) !== null)
        localStorage.removeItem(`datatable_${this.storedOptions.id}_options`)
      if (localStorage.getItem(`datatable_${this.storedOptions.id}_columns`))
        localStorage.removeItem(`datatable_${this.storedOptions.id}_columns`)
    }
  }
}
