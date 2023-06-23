import { readOnce, write } from '$lib/useFirebase'
import type { IColumnMetaData, IStoreOptions, ITableOptions, loadStore } from '$lib/components/DataTable'

export class firebaseStorageOptions implements IStoreOptions {
  storedOptions: ITableOptions
  storedColumns: IColumnMetaData[] | undefined

  constructor(options: ITableOptions | undefined) {
    // Set standard options
    if (options) {
      let defaultOptions = {
        id: undefined,
        currentPage: 1,
        rowsPerPage: 20,
        rowsPerPageOptions: [10, 20, 50, 100],
        actionColumn: false,
        singleSort: false,
        defaultColumnWidth: 200,
      }
      Object.assign(defaultOptions, options)
      this.storedOptions = defaultOptions
    } else
      this.storedOptions = {
        id: 'default',
        currentPage: 1,
        rowsPerPage: 20,
        rowsPerPageOptions: [10, 20, 50, 100],
        actionColumn: false,
        singleSort: false,
        defaultColumnWidth: 200,
      }
  }

  load = async (id: string): Promise<loadStore> => {
    return new Promise(async (resolve, reject) => {
      // If there is no userId given for authentication, create a deviceId and save it in the localStorage to identify the device
      this.storedOptions.id = id
      if (this.storedOptions) {
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
        if (this.storedOptions.userId && id) {
          // Read the data for the DataTable with the given id
          try {
            const data = await readOnce(`${this.storedOptions.userId}/${this.storedOptions.id}/Datatable`)
            if (data) {
              Object.assign(this.storedOptions, data.options)
              this.storedColumns = data.columns
            } else this.store(this.storedOptions, this.storedColumns)
          } catch (e) {
            this.store(this.storedOptions, this.storedColumns)
          }
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
      if(columns) {
        for (let col of Object.keys(columns!)) {
          for (let [key, prop] of Object.entries(columns![col as keyof object])) {
            if (prop === undefined) {
              columns[col as keyof object][key] = null
            }
          }
        }
      }
      for (let [key, prop] of Object.entries(options)) {
        if (prop === undefined) {
          options![key as keyof object] = null
        }
      }
      let storeObj: Record<string, any> = {}
      if(options) storeObj["options"] = options
      if(columns) storeObj["columns"] = columns
      write(`${this.storedOptions.userId}/${this.storedOptions.id}/Datatable`, storeObj)
    }
  }
}
