const filterData = async(table: any, filters?: any) => {
    let filteredData: [string, any][][] = []

    if(filters != undefined){
        console.log("filtering")
    }

    // TODO: filter first and then manipulate the data
    for(let i = 0; i < table._total; i ++){
        let data = []
        for(let col of Object.keys(table._data)){
            data.push(table._data[col].data[i])
        }
        filteredData.push(data)
    }

    return filteredData
}

const orderData = async() => {
    // console.log("ordering")
}

const updatePagination = async() => {
    // console.log("updating pagination")
}

const getColumns = async(table: any) => {
    const cols = []
    const columns = table._names
    for(let col of columns){
        cols.push({
            column: col,
            type: 0
        })
    }
    return cols
}

onmessage = async({ data: { file, filter, ordering, pagination, rowsPerPage }}) => {
    const cols = await getColumns(file)
    const data = await filterData(file, filter)
    if(ordering){
        await orderData()
    }
    if(pagination || rowsPerPage){
        await updatePagination()
    }


    const message = {
        data: {
            data: data,
            columns: cols
        }
    }
    postMessage(message)
}

export {}