<script lang="ts">
    import DataTableRenderer from "$lib/components/DataTableRenderer.svelte";
    import type ITable from "../lib/interfaces/ITable";
    import type {IFilter} from "../lib/interfaces/IFilter";
    import type IPaginated from "../lib/interfaces/IPaginated";
    import type {ITableData} from "../lib/interfaces/ITableData";
    import type {ISort} from "../lib/interfaces/ISort";
	import type { IScheme } from "$lib/interfaces/IScheme";
    import { sorting, pagination } from "$lib/store"
	import type ISorting from "$lib/interfaces/ISorting";

    /*
        Get the column names out of the data
    */
    const getColumnsFromData = async() => {
        const columns: IScheme[] = []
        for(let info of data[0]) {
            let typeFound: number = 0
            switch(typeof(info[1])){
                case "string":
                    typeFound = 0
                    break;
                
                case "number":
                    typeFound = 1
                    break;

                case "boolean":
                    typeFound = 2
                    break;
            }
            if(!columns.includes({
                column: info[0],
                type: typeFound
            })) {
                columns.push({
                    column: info[0],
                    type: typeFound
                })
            }
        }
        return columns
    }

    /*
        Get the filtered data without the column names in it
    */
    const FilterData = async() =>{
        let filteredData: [string, any][][] = []
        for(let person of data){
            let personInfo = []
            for(let information of person){
                personInfo.push(information[1])
            }
            filteredData.push(personInfo)
        }
        return filteredData
    }

    /*
        Fill in the sorting store with the column names
    */
    const fillSortingStore = async(columns: IScheme[]) => {
        let localSt = []
        for(let col of columns){
            localSt.push({
                column: col.column,
                times: 0
            })
        }
        sorting.set(localSt)
    }

    /*
        Update the pagination store with the number of pages
    */
    const updatePaginationStore = async(dataLength: number) => {
        pagination.set({
            currentPage: $pagination.currentPage,
            totalPages: Math.ceil(dataLength / $pagination.rowsPerPage),
            rowsPerPage: $pagination.rowsPerPage
        })
    }

    /*
        Some test data
    */
    export var data: [string, any][][]; data = [
        Object.entries({ name: "Rory", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Amethyst", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Bob", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Cindy", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Derek", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Eve", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Frank", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Gina", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Hannah", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Ivan", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Jenny", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Karl", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
    ];

    export var table: ITable = {
        setColumnFilter(value: IFilter): void {
            return;
        }, 
        setColumnSort(value: ISort): void {           
            sorting.update((sort): ISorting[] => {
                const sorting = sort
                const index = sorting.findIndex(obj => obj.column == value.column)
                sorting[index] = {
                    column: value.column,
                    times: sorting[index].times + 1
                }
                return sorting
            })
            if($sorting.filter(obj => obj.column == value.column)[0].times > 2 || $sorting.filter(obj => obj.column == value.column)[0].times < 0) $sorting.filter(obj => obj.column == value.column)[0].times = 0
        },
        setTablePagination(tablePagination: IPaginated): void {
            pagination.set(tablePagination)
            console.log($pagination)
        },
        getData(columnFilters?: IFilter[], columnSorts?: ISort[], tablePagination?: IPaginated): Promise<ITableData> {
            return new Promise(async(resolve, reject) => {
                const columns = await getColumnsFromData()
                const filteredData = await FilterData()
                fillSortingStore(columns)
                updatePaginationStore(filteredData.length)
                return resolve({
                    data: filteredData,
                    scheme: columns 
                })
            })
        }
    };
</script>
<h1>RADar-DataTable Demo - Simple Data</h1>
<p>This page demonstrates simple data, consisting of a matrix of key value pairs, also known as an array of `Object.entries(myObject)`.<p></p>
<DataTableRenderer bind:table />
