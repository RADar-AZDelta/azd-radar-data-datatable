import SortDirection from '../classes/enums/SortDirection'
import Types from '../classes/enums/Types'
import type IFilter from '$lib/interfaces/IFilter'
import type IPaginated from '$lib/interfaces/IPaginated'
import type IScheme from '$lib/interfaces/IScheme'
import type ISort from '$lib/interfaces/ISort'
import { desc, escape, fromCSV, fromJSON, loadCSV, table } from 'arquero'
import type ColumnTable from 'arquero/dist/types/table/column-table'
import type IMapping from '$lib/interfaces/IMapping'

let originalData: ColumnTable
let mappedData: Array<Object>
let cols: IScheme[]

const autoMapper = async (
  tableData: [string | number | boolean][],
  mapping: IMapping,
  pagination: IPaginated
): Promise<[string | number | boolean][]> => {
  return new Promise(async (resolve, reject) => {
    let colIndex = 0
    for (let col of cols) {
      if (col.column == 'sourceName') {
        colIndex = cols.indexOf(col)
      }
    }
    const dataMapping = tableData.slice(
      pagination.rowsPerPage * (pagination.currentPage - 1),
      pagination.rowsPerPage * (pagination.currentPage - 1) + pagination.rowsPerPage
    )
    for (let row of dataMapping) {
      const rowIndex = tableData.indexOf(row)
      const extracted = await editData(row, colIndex, mapping)
      let content: object | string = extracted
      if (typeof extracted == 'object') {
        for (let path of mapping.contentPath) {
          content = content[path as keyof object]
        }
        if (Array.isArray(content) == true) {
          content = content[0 as keyof object]
        }
      }
      if (content != undefined) {
        let count = 3
        let end = tableData[rowIndex].length
        for (let key of Object.keys(content)) {
          if (cols.filter(col => col.column == key).length == 0) {
            cols.push({
              column: key,
              type: Types.string,
              editable: true,
              visible: true,
            })
          }
          tableData[rowIndex].splice(count, 0, content[key as keyof object])
          tableData[rowIndex].splice(count + 1, end)
          count += 1
        }
      }
    }
    cols = Array.from(new Set(cols))
    const table = await transpilerToTableFromArray(tableData, cols)
    mappedData = table.objects()
    resolve(tableData)
  })
}

const transpilerToTableFromArray = async (dataArray: Array<any>, columns: IScheme[]): Promise<ColumnTable> => {
  return new Promise((resolve, reject) => {
    const columnsArray: string[] = []
    const dataFound: any = {}
    for (let col of columns) {
      columnsArray.push(col.column)
    }
    for (let i = 0; i < columnsArray.length; i++) {
      const d: Array<Object> = []
      for (let obj of dataArray) {
        d.push(obj[i])
      }
      dataFound[columnsArray[i]] = d
    }
    originalData = table(dataFound)
    resolve(originalData)
  })
}

const transpilerToTable = async (dataObject: Array<Object>, originalColumns: IScheme[]): Promise<ColumnTable> => {
  return new Promise((resolve, reject) => {
    const columnsArray: string[] = []
    const dataFound: any = {}
    for (let key in dataObject[0]) {
      columnsArray.push(key)
      if (cols.filter((col: IScheme) => col.column == key).length == 0) {
        cols.push({
          column: key,
          type: key == 'id' ? Types.number : Types.string,
          editable: true,
          visible:
            originalColumns.filter(obj => (obj.column = key)).length == 0
              ? true
              : originalColumns.filter(obj => (obj.column = key))[0].visible,
        })
      }
    }
    for (let col of columnsArray) {
      const d: Array<Object> = []
      for (let obj of dataObject) {
        d.push(obj[col as keyof Object])
      }
      dataFound[col] = d
    }
    originalData = table(dataFound)
    resolve(originalData)
  })
}

const transpilerToObjects = async (table: ColumnTable, cols: readonly string[], total: number): Promise<object[]> => {
  return new Promise(async (resolve, reject) => {
    let filteredData: object[] = Array.from(new Set(table.objects()))
    if (filteredData.length > 0) {
      for (let i = 0; i < filteredData.length; i++) {
        let data = []
        for (let col of cols) {
          data.push(filteredData[i][col as keyof Object])
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

const editData = async (data: object, columnIndex: number, mapping: IMapping) => {
  let sourceName: string = data[columnIndex as keyof object]
  let url = mapping.mappingURL
  url += `query=${sourceName.replaceAll('-', ' ')}&pageSize=1`
  url = encodeURI(url)
  return await extractDataREST(
    false,
    url,
    mapping.mappingFileType,
    mapping.mappingFetchOptions,
    mapping.mappingDelimiter
  )
}

const mappingData = async (mapping: any, columns: IScheme[]): Promise<ColumnTable> => {
  return new Promise(async (resolve, reject) => {
    mappedData[mapping.row]['EQUIVALENCE' as keyof Object] = mapping.equivalence
    mappedData[mapping.row]['Author' as keyof Object] = mapping.author
    for (let col in mapping.columns) {
      const colName: string = mapping.columns[col].column
      const data: any = Array.from(mapping.data)
      const filteredData: any = data[col]
      mappedData[mapping.row][colName as keyof Object] = filteredData
    }
    let table = await transpilerToTable(mappedData, columns)
    resolve(table)
  })
}

const filterData = async (table: ColumnTable, filters: IFilter[], cols: IScheme[]): Promise<object[]> => {
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
    const transpiledData = await transpilerToObjects(table, table._names, table._total)

    resolve(transpiledData)
  })
}

const orderData = async (table: ColumnTable, sorts: ISort[]): Promise<ColumnTable> => {
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

const getDataNeeded = async (data: object[], pagination: IPaginated): Promise<object[]> => {
  return new Promise((resolve, reject) => {
    const result = data.slice(
      pagination.currentPage * pagination.rowsPerPage - pagination.rowsPerPage,
      pagination.rowsPerPage * pagination.currentPage
    )

    resolve(result)
  })
}

const updatePagination = async (data: object[], pagination: IPaginated): Promise<IPaginated> => {
  return new Promise((resolve, reject) => {
    let updatedPag: IPaginated = {
      currentPage: pagination.currentPage,
      rowsPerPage: pagination.rowsPerPage,
      totalPages: Math.ceil(data.length / pagination.rowsPerPage),
      totalRows: data.length,
    }
    resolve(updatedPag)
  })
}

const getColumns = async (originalColumns: IScheme[]): Promise<IScheme[]> => {
  return new Promise((resolve, reject) => {
    let cols: IScheme[] = []
    const columns = originalData._names
    for (let col of columns) {
      let type = Types.string
      if (/^\d+$/.test(originalData._data[col].data[0]) == true) type = Types.number
      else if (originalData._data[col].data[0] == true || originalData._data[col].data[0] == false) type = Types.boolean
      else if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/.test(originalData._data[col].data[0]) == true)
        type = Types.date

      const originalColumn = originalColumns.filter(obj => obj.column.toLowerCase() == col.toLowerCase())
      let visible = true
      originalColumn[0] == undefined ? (visible = true) : (visible = originalColumn[0].visible)

      cols.push({
        column: col,
        type: type,
        editable: false,
        visible: visible,
      })
    }
    resolve(cols)
  })
}

const extractDataREST = async (
  tableFormat: boolean,
  filePath: string,
  fileType: string,
  fetchOptions: Object,
  delimiter: string
) => {
  let dataReceived: ColumnTable | string | Object
  if (filePath && fileType.toLowerCase() == 'csv') {
    const response = await fetch(filePath, fetchOptions)
    const data = await response.text()
    dataReceived = await fromCSV(data, { delimiter: delimiter })
    if (tableFormat == true) dataReceived = await fromCSV(data, { delimiter: delimiter })
    else dataReceived = data
    return dataReceived
  } else if (filePath && fileType.toLowerCase() == 'json') {
    const response = await fetch(filePath, fetchOptions)
    let data: string | Object
    if (response.url.includes('data:application/json')) {
      data = atob(response.url.substring(29))
    } else {
      data = await response.json()
    }
    if (tableFormat == true) dataReceived = await fromJSON(data, { autoType: true })
    else dataReceived = data
    return dataReceived
  } else {
    dataReceived = table({})
  }
  return dataReceived
}

const extractDataFile = async (fileType: string, file: File, delimiter: string): Promise<ColumnTable> => {
  if (fileType.toLowerCase() == 'csv') {
    const text = await file.text()
    originalData = await fromCSV(text, { delimiter: delimiter })
  } else if (fileType.toLowerCase() == 'json') {
    const text = await file.text()
    originalData = await fromJSON(text, { autoType: true })
  }
  return originalData
}

const getData = async (
  filePath: string,
  file: File,
  delimiter: string,
  method: string,
  fileType: string,
  fetchOptions: Object
): Promise<ColumnTable> => {
  return new Promise(async (resolve, reject) => {
    let extractedData: ColumnTable
    if (method == 'REST') {
      // @ts-ignore
      extractedData = await extractDataREST(true, filePath, fileType, fetchOptions, delimiter)
      originalData = extractedData
      mappedData = extractedData.objects()
    } else if (method == 'file') {
      extractedData = await extractDataFile(fileType, file, delimiter)
      mappedData = extractedData.objects()
    } else if (method == 'local') {
      extractedData = await loadCSV(filePath, { delimiter: delimiter })
      mappedData = extractedData.objects()
    }
    resolve(originalData)
  })
}

const updateTableData = async (index: string, value: string): Promise<void> => {
  const indexes = index.split('-')
  const row = Number(indexes[0])
  const col = Number(indexes[1])
  const colName = originalData._names[col]
  originalData._data[colName].data[row] = value
}

onmessage = async ({
  data: {
    filePath,
    file,
    delimiter,
    method,
    fileType,
    fetchOptions,
    filter,
    order,
    pagination,
    editData,
    mapping,
    getCSV,
    autoMapping,
    mapper,
    columns,
  },
}) => {
  let sorts: ISort[]
  let filters: IFilter[]
  filter != undefined ? (filters = filter) : (filters = [])
  order != undefined ? (sorts = order) : (sorts = [])
  let orderedData: ColumnTable,
    filteredData: any = [],
    paginatedData: IPaginated = {
      currentPage: 1,
      rowsPerPage: 10,
      totalPages: 1,
      totalRows: 10,
    },
    data: object[] = [],
    table: ColumnTable
  if ((getCSV == undefined && originalData == undefined) || originalData == null) {
    // First time loading data
    table = await getData(filePath, file, delimiter, method, fileType, fetchOptions)
    cols = await getColumns(columns)
    if (order) {
      orderedData = await orderData(table, order)
      filteredData = await filterData(orderedData, filters, cols)
    } else {
      filteredData = await filterData(originalData, filters, cols)
    }
    if (pagination) {
      paginatedData = await updatePagination(filteredData, pagination)
    }
    if (autoMapping == true) {
      const dataMapping = filteredData.slice(
        pagination.rowsPerPage * (pagination.currentPage - 1),
        pagination.rowsPerPage * (pagination.currentPage - 1) + pagination.rowsPerPage
      )
      if (dataMapping[0].length <= 3) {
        data = await autoMapper(filteredData, mapper, pagination)
      }
    } else {
      data = filteredData
    }
    data = await getDataNeeded(data, pagination)
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        pagination: paginatedData,
        origin: 'initial',
      },
    })
  } else if (getCSV == true && originalData !== undefined && originalData !== null) {
    // When download button was clicked
    const file = originalData.toCSV({ delimiter: ',' })
    postMessage({
      processedData: {
        data: file,
      },
    })
  } else if (mapping != undefined || mapping != null) {
    // When a row has been mapped
    table = await mappingData(mapping, columns)
    table = await orderData(table, sorts)
    data = await filterData(table, filters, cols)
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        update: true,
        origin: 'mapping',
      },
    })
  } else if (editData != undefined || editData != null) {
    // When a cell has been edited
    await updateTableData(editData.index, editData.value)
    filteredData = await filterData(originalData, filters, cols)
    data = await getDataNeeded(filteredData, pagination)
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        origin: 'edit',
      },
    })
  } else {
    // When manipulation (filtering, sorting and pagination) has been done
    cols = columns
    orderedData = await orderData(originalData, order)
    filteredData = await filterData(orderedData, filter, cols)
    paginatedData = await updatePagination(filteredData, pagination)
    const dataMapping = filteredData.slice(
      pagination.rowsPerPage * (pagination.currentPage - 1),
      pagination.rowsPerPage * (pagination.currentPage - 1) + pagination.rowsPerPage
    )
    const lastItem = dataMapping.pop()
    const undefinedCount = lastItem.filter((value: any) => value == undefined)
    if (autoMapping == true && undefinedCount.length >= 3) {
      data = await autoMapper(filteredData, mapper, pagination)
    } else {
      data = filteredData
    }
    data = await getDataNeeded(data, paginatedData)
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        pagination: pagination,
        origin: 'manipulation',
      },
    })
  }
}

export {}
