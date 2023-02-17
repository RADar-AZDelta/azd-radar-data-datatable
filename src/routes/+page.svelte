<script lang="ts">
    import DataTableRenderer from "$lib/components/DataTableRenderer.svelte";
    import type ITable from "../lib/interfaces/ITable";
    import type {IFilter} from "../lib/interfaces/IFilter";
    import type IPaginated from "../lib/interfaces/IPaginated";
    import type {ITableData} from "../lib/interfaces/ITableData";
    import type {ISort} from "../lib/interfaces/ISort";
    //random test data withou duplicates
    export var data: [string, any][][]; data = [
        Object.entries({ name: "Rory", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Amethyst", age: 25, country: "Canada", }),
        Object.entries({ name: "Bob", age: 55, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Cindy", age: 45, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Derek", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Eve", age: 25, country: "Canada", }),
        Object.entries({ name: "Frank", age: 55, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Gina", age: 45, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Hannah", age: 35, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Ivan", age: 25, country: "Canada", }),
        Object.entries({ name: "Jenny", age: 55, country: "USA", telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
        Object.entries({ name: "Karl", age: 45, telephone: "0800-123-524-634", address: "123 Main Street, New York, NY 10001" }),
    ];
    export var table: ITable = {
        setColumnFilter(col: string, value: IFilter): void {
            return;
        }, setColumnSort(col: string, value: ISort): void {
            return;
        }, setData(): void {
            return;
        },
        getData(columnFilters?: IFilter[], columnSorts?: ISort[], tablePagination?: IPaginated): Promise<ITableData> {
            return Promise.resolve({
                data: data,
                columns: ["name", "age", "country", "telephone", "address"],
            } as ITableData);
        }
    };
    // console.log(data)
</script>
<h1>RADar-DataTable Demo - Simple Data</h1>
<p>This page demonstrates simple data, consisting of a matrix of key value pairs, also known as an array of `Object.entries(myObject)`.<p></p>
<DataTableRenderer bind:table />
