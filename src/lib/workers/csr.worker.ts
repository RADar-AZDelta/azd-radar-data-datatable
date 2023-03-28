import SortDirection from '../classes/enums/SortDirection'
import Types from '../classes/enums/Types'
import type IFilter from '$lib/interfaces/IFilter'
import type IPaginated from '$lib/interfaces/IPaginated'
import type IScheme from '$lib/interfaces/IScheme'
import type ISort from '$lib/interfaces/ISort'
import { desc, escape, fromCSV, fromJSON, loadCSV, table } from 'arquero'
import type ColumnTable from 'arquero/dist/types/table/column-table'
import type IMapper from '$lib/interfaces/IMapper'
import type IColumnName from '$lib/interfaces/IColumnName'
import { writable } from 'svelte/store'

let originalData: ColumnTable
let mappedData: Array<Object>
let cols: IScheme[]

let mappingCount = writable<number>(3)

const addDataToRow = async (
  obj: object | string,
  data: [string | number | boolean][],
  rowIndex: number,
  startingIndex: number,
  endingIndex: number,
  expectedColumns?: IColumnName[]
) => {
  for (let key of Object.keys(obj)) {
    let name = key
    if (expectedColumns == undefined ? true : expectedColumns.filter(col => col.name == key).length != 0) {
      name = expectedColumns == undefined ? key : expectedColumns?.filter(col => col.name == key)[0].altName
      if (cols.filter(col => col.column == name).length == 0) {
        cols.push({
          column: name,
          type: Types.string,
          editable: true,
          visible: true,
        })
        data[rowIndex as keyof object].splice(startingIndex, 0, obj[key as keyof object])
        data[rowIndex].splice(startingIndex + 1, endingIndex)
        startingIndex += 1
      } else {
        const index = cols.indexOf(cols.filter(col => col.column == name)[0])
        data[rowIndex as keyof object].splice(index, 1, obj[key as keyof object])
        startingIndex += 1
      }
    }
  }
  mappingCount.set(startingIndex)
  return data
}

const autoMapper = async (
  tableData: [string | number | boolean][],
  mapping: IMapper,
  pagination: IPaginated
): Promise<[string | number | boolean][]> => {
  return new Promise(async (resolve, reject) => {
    let colIndex = 0
    for (let col of cols) {
      if (col.column == 'sourceName') {
        colIndex = cols.indexOf(col)
      }
    }
    // Get the data that needs to be mapped
    const dataMapping = tableData.slice(
      pagination.rowsPerPage * (pagination.currentPage - 1),
      pagination.rowsPerPage * (pagination.currentPage - 1) + pagination.rowsPerPage
    )
    for (let row of dataMapping) {
      const rowIndex = tableData.indexOf(row)
      // Get the data from the Athena API
      const extracted = await createURL(row, colIndex, mapping)
      // Get the content from the data from the Athena API
      let content: object | string = extracted
      if (typeof extracted == 'object') {
        for (let path of mapping.contentPath) {
          content = content[path as keyof object]
        }
        if (Array.isArray(content) == true) {
          content = content[0 as keyof object]
        }
      }

      let start = 3
      let end = tableData[rowIndex].length
      // Are there fields that need to be added to the table?
      if (mapping.additionalFields != undefined) {
        mappingCount.subscribe(value => {
          start = value
        })
        tableData = await addDataToRow(mapping.additionalFields, tableData, rowIndex, start, end)
      }
      // Is there content found in the data from the Athena API?
      if (content != undefined) {
        mappingCount.subscribe(value => {
          start = value
        })
        tableData = await addDataToRow(content, tableData, rowIndex, start, end, mapping.expectedColumns)
      }
    }
    cols = Array.from(new Set(cols))
    // Transpile to table for later use
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

const createURL = async (data: object, columnIndex: number, mapping: IMapper) => {
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


const updateData = async (
  data: any,
  map: any,
  expectedColumns: IColumnName[],
  originalRow: number,
  replace: boolean,
  count: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let c = 0
    let copy = data[originalRow + count]
    console.log('COPY FOR ROW ', map.row, ' --> ', data[originalRow])
    console.log('IT CAN ALSO BE THIS ', data[originalRow + count])
    console.log('REPLACE ', replace)
    for (let col of expectedColumns) {
      const colName: string = col.altName
      const filteredData = map.data[col.name]
      copy[colName as keyof Object] = filteredData
      console.log(data[map.row])
      console.log(
        `FROM data `,
        data[map.row],
        ' WITH ROW ',
        map.row,
        ' COMES ',
        data[map.row][colName as keyof Object],
        ' AND FILTERED DATA ',
        filteredData
      )
      c++
    }
    if (c == expectedColumns.length) {
      if (replace == true) {
        data.splice(map.row + 1, 0, copy)
        delete data[map.row]
        console.log(data)
      } else {
        data.splice(map.row + 1, 0, copy)
      }

      mappedData = data
      resolve(data)
    }
  })
}

const manipulateData = async (
  data: any,
  mapping: any,
  columns: IScheme[],
  expectedColumns: IColumnName[]
): Promise<ColumnTable> => {
  return new Promise(async (resolve, reject) => {
    // console.log(data)
    let count = 0
    if(mapping[0] != undefined){
      for (let map of mapping) {
        const updatedValues = await updateData(
          data,
          map,
          expectedColumns,
          mapping[0].row,
          count == 0 ? true : false,
          count
        )
        data = updatedValues
        count++
      }
      if (count == mapping.length) {
        data.splice(mapping[0].row, 1)
        console.log(data)
        let table = await transpilerToTable(data, columns)
        resolve(table)
      }
    } else {
      for(let col of expectedColumns){
        const colName: string = col.altName
        const filteredData: any = mapping.data[col.name]
        data[mapping.row][colName as keyof Object] = filteredData
      }
      mappedData = data
      let table = await transpilerToTable(data, columns)
      resolve(table)
    }
  })
}

const manipulateDataUpdate = async (action: any, columns: IScheme[]): Promise<ColumnTable> => {
  return new Promise(async (resolve, reject) => {
    for (let column of action.expectedColumns) {
      mappedData[action.row][column.altName as keyof Object] = column.data
    }
    let table = await transpilerToTable(mappedData, columns)
    resolve(table)
  })
}

const manipulateDataPage = async (action: any, columns: IScheme[]): Promise<ColumnTable> => {
  return new Promise(async (resolve, reject) => {
    for (let row = action.startRow; row <= action.endRow; row++) {
      for (let column of action.expectedColumns) {
        mappedData[row][column.altName as keyof Object] = column.data
      }
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
    console.log('TABLE ', table)
    const transpiledData = await transpilerToObjects(table, table._names, table._total)

    resolve(transpiledData)
  })
}

const orderData = async (table: ColumnTable, sorts: ISort[]): Promise<ColumnTable> => {
  return new Promise((resolve, reject) => {
    console.log('TABLE HERE ', table)
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

const updateTableData = async (index: string, value: string, extraChanges: Array<any>): Promise<void> => {
  const indexes = index.split('-')
  const row = Number(indexes[1])
  const col = Number(indexes[0])
  for (let change of extraChanges) {
    originalData._data[change.column].data[row] = change.value
  }
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
    expectedColumns,
    action,
    actionPage,
    extraChanges,
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
      } else {
        data = filteredData
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
      },
    })
  } else if (action && originalData !== undefined && originalData !== null) {
    table = await manipulateDataUpdate(action, cols)
    if (sorts) {
      orderedData = await orderData(table, sorts)
      filteredData = await filterData(orderedData, filters, cols)
    } else {
      filteredData = await filterData(table, filters, cols)
    }
    data = filteredData
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        update: true,
      },
    })
  } else if (actionPage && originalData !== undefined && originalData !== null) {
    table = await manipulateDataPage(actionPage, cols)
    if (sorts) {
      orderedData = await orderData(table, sorts)
      filteredData = await filterData(orderedData, filters, cols)
    } else {
      filteredData = await filteredData(table, filters, cols)
    }
    data = filteredData
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        update: true,
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
    // TODO: fix bug where data is not being updated correctly when mapping multiple
    await manipulateData(mappedData, mapping, columns, expectedColumns)
      .then(async table => await orderData(table, sorts))
      .then(async table => await filterData(table, filters, cols))
      .finally(async () => {
        await postMessage({
          processedData: {
            data: data,
            columns: cols,
            update: true,
          },
        })
      })
  } else if (editData != undefined || editData != null) {
    // When a cell has been edited
    await updateTableData(editData.index, editData.value, extraChanges)
    filteredData = await filterData(originalData, filters, cols)
    data = await getDataNeeded(filteredData, pagination)
    await postMessage({
      processedData: {
        data: data,
        columns: cols,
        update: true,
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
      },
    })
  }
}

export {}
