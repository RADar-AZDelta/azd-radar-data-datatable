import { readOnce, write } from '$lib/useFirebase'
import type { IColumnMetaData, IStoreOptions, ITableOptions, loadStore } from '$lib/components/DataTable'

export class firebaseStorageOptions implements IStoreOptions {
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

  load = async (): Promise<loadStore> => {
    return new Promise(async (resolve, reject) => {
      // If there is no userId given for authentication, create a deviceId and save it in the localStorage to identify the device
      if (!this.storedOptions.userId) {
        let id: string
        if (!localStorage.getItem('deviceId')) {
          id = crypto.randomUUID()
          localStorage.setItem('deviceId', id)
        } else id = localStorage.getItem('deviceId')!
        this.storedOptions.userId = id
      }
      if (!this.storedOptions.userId || !this.storedOptions.id)
        resolve({ savedOptions: this.storedOptions, savedColumns: this.storedColumns })

      if (this.storedOptions.userId && this.storedOptions.id) {
        // Read the data for the DataTable with the given id
        try {
          const data = await readOnce(`${this.storedOptions.userId}/${this.storedOptions.id}/Datatable`)
          if (data) {
            this.storedOptions = data.options
            this.storedColumns = data.columns
          }
        } catch (e) {
          this.store(this.storedOptions, this.storedColumns)
        }
      }
      resolve({ savedOptions: this.storedOptions, savedColumns: this.storedColumns })
    })
  }

  store = (options: ITableOptions, columns: IColumnMetaData[] | undefined): void => {
    // If there is no userId given for authentication, create a deviceId and save it in the localStorage to identify the device
    this.storedOptions = options
    this.storedColumns = columns
    if (!this.storedOptions.userId) {
      let id: string
      if (!localStorage.getItem('deviceId')) {
        id = crypto.randomUUID()
        localStorage.setItem('deviceId', id)
      } else id = localStorage.getItem('deviceId')!
      this.storedOptions.userId = id
    }
    // Remove all the undefined values and replace them with "null" because the database can't work with undefined
    if (this.storedOptions.userId && this.storedOptions.id) {
      // Write the options and columns to the database under the given DataTable id
      delete this.storedOptions.dataTypeImpl
      for (let col of Object.keys(columns!)) {
        for (let [key, prop] of Object.entries(columns![col as keyof object])) {
          if (prop === undefined) {
            columns![col as keyof object][key] = null
          }
        }
      }
      for (let [key, prop] of Object.entries(options)) {
        if (prop === undefined) {
          options![key as keyof object] = null
        }
      }
      write(`${this.storedOptions.userId}/${this.storedOptions.id}/Datatable`, {
        options: options,
        columns: columns,
      })
    }
  }
}
