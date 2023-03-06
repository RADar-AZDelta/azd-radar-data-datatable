import SortDirection from '../classes/enums/SortDirection'
import Types from '../classes/enums/Types'
import type IFilter from '$lib/interfaces/IFilter'
import type IPaginated from '$lib/interfaces/IPaginated'
import type IScheme from '$lib/interfaces/IScheme'
import type ISort from '$lib/interfaces/ISort'
import { desc, escape, fromCSV, fromJSON, loadCSV } from 'arquero'

let originalData: any
let cols: IScheme[]

const transpiler = async (table: any, cols: any, total: number): Promise<[string, any][][]> => {
  return new Promise((resolve, reject) => {
    let filteredData: [string, any][][] = Array.from(new Set(table.objects()))
    if (filteredData.length > 0) {
      for (let i = 0; i < filteredData.length; i++) {
        let data = []
        for (let col of cols) {
          data.push(filteredData[i][col])
        }
        filteredData[i] = data
      }
    } else {
      for (let i = 0; i < total; i++) {
        let data = []
        for (let col of cols) {
          data.push(table._data[col].data[i])
        }
        filteredData.push(data)
      }
    }

    resolve(filteredData)
  })
}

const filterData = async (table: any, filters: IFilter[]) => {
  return new Promise(async (resolve, reject) => {
    // If there are filters
    if (filters != undefined && filters.length > 0) {
      for (let filter of filters) {
        table = table.filter(
          escape((d: any) => {
            const type = cols.filter(col => col.column == filter.column)[0].type
            if (type == Types.string) {
              let t: any = type
              if (t instanceof RegExp) return new RegExp(filter.filter.toString()).test(d[filter.column])
              else {
                if (d[filter.column] != null) return d[filter.column].includes(filter.filter)
              }
            } else if (type == Types.number || type == Types.boolean) return d[filter.column] == filter.filter
            else if (type == Types.date) return d[filter.column].getTime() == new Date(String(filter.filter)).getTime()!
          })
        )
      }
    }

    const transpiledData = await transpiler(table, table._names, table._total)

    resolve(transpiledData)
  })
}

const orderData = async (table: any, sorts: ISort[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    let orderedTable = table
    for (let sort of sorts) {
      if (sort.direction == SortDirection.Ascending) {
        orderedTable = orderedTable.orderby(sort.column)
      } else if (sort.direction == SortDirection.Descending) {
        orderedTable = orderedTable.orderby(desc(sort.column))
      }
    }
    resolve(orderedTable)
  })
}

const updatePagination = async (data: [string, any][][], pagination: IPaginated): Promise<Object> => {
  return new Promise((resolve, reject) => {
    let updatedPag: IPaginated = {
      currentPage: pagination.currentPage,
      rowsPerPage: pagination.rowsPerPage,
      totalPages: Math.ceil(data.length / pagination.rowsPerPage),
      totalRows: data.length,
    }
    const results = data.slice(
      pagination.currentPage * pagination.rowsPerPage - pagination.rowsPerPage,
      pagination.rowsPerPage * pagination.currentPage
    )
    resolve({
      data: results,
      pag: updatedPag,
    })
  })
}

const getColumns = async (): Promise<IScheme[]> => {
  return new Promise((resolve, reject) => {
    let cols: IScheme[] = []
    const columns = originalData._names
    for (let col of columns) {
      let type = Types.string
      if (/^\d+$/.test(originalData._data[col].data[0]) == true) type = Types.number
      else if (originalData._data[col].data[0] == true || originalData._data[col].data[0] == false) type = Types.boolean
      else if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/.test(originalData._data[col].data[0]) == true)
        type = Types.date
      cols.push({
        column: col,
        type: type,
      })
    }
    resolve(cols)
  })
}

const getData = async (
  filePath: string,
  file: File,
  delimiter: string,
  method: string,
  fileType: string,
  fetchOptions: Object
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    if (method == 'REST') {
      if (filePath && fileType.toLowerCase() == 'csv') {
        const response = await fetch(filePath, fetchOptions)
        const data = await response.text()
        originalData = await fromCSV(data, { delimiter: delimiter })
      } else if (filePath && fileType.toLowerCase() == 'json') {
        const response = await fetch(filePath, fetchOptions)
        let data
        if (response.url.includes('data:application/json')) {
          data = atob(response.url.substring(29))
        } else {
          data = await response.json()
        }
        originalData = await fromJSON(data, { autoType: true })
      }
    } else if (method == 'file') {
      if (fileType.toLowerCase() == 'csv') {
        const text = await file.text()
        originalData = await fromCSV(text, { delimiter: delimiter })
      } else if (fileType.toLowerCase() == 'json') {
        const text = await file.text()
        originalData = await fromJSON(text, { autoType: true })
      }
    } else if (method == 'local') {
      originalData = await loadCSV(filePath, { delimiter: delimiter })
    }
    resolve(originalData)
  })
}

onmessage = async ({
  data: { filePath, file, delimiter, method, fileType, fetchOptions, filter, order, pagination },
}) => {
  let data: any = originalData
  await getData(filePath, file, delimiter, method, fileType, fetchOptions)
    .then(async () => (cols = await getColumns()))
    .then(async () => {
      if (order) {
        data = await orderData(originalData, order)
      }
    })
    .then(async () => (data = await filterData(data, filter)))
    .then(async () => {
      if (pagination) {
        data = await updatePagination(data, pagination)
      }
    })
    .finally(() =>
      postMessage({
        processedData: {
          data: data.data == undefined ? data : data.data,
          columns: cols,
          pagination: data.pag == undefined ? data.pagination : data.pag,
        },
      })
    )
}

export {}
