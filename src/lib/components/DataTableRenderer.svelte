<script lang="ts">
    import type ITable from "../interfaces/ITable";
    import { sorting, pagination } from "$lib/store"
	import { writable } from "svelte/store";

    export let table: ITable;

    let update = 0

    const rows = writable<number>($pagination.rowsPerPage)

    const updateTable = async() => {
        update += 1
    }

    const updateSorting = async(col: string) => {
        /*
            Update the column sort
        */
        table.setColumnSort({
            column: col,
            direction: $sorting.filter(obj => obj.column == col)[0].times + 1
        })
        updateTable()
    }

    const changePage = async(page: number) => {
        /*
            Update the pagination
        */
       if(page > $pagination.totalPages) page--
       if(page < 1) page = 1
        table.setTablePagination({
            currentPage: page,
            totalPages: $pagination.totalPages,
            rowsPerPage: $pagination.rowsPerPage
        })
        updateTable()
    }

    const updateRowsPerPage = async() => {
        /*
            Update the rows per page
        */

        table.setTablePagination({
            currentPage: $pagination.currentPage,
            totalPages: $pagination.totalPages,
            rowsPerPage: Number($rows)
        })
        updateTable()
    }

    async function updateFiltering (event: any) {
        const filterValue: string | RegExp | number | undefined = event.target.value
        const filterColumn: string = event.target.placeholder.split(" ")[2]
        table.setColumnFilter({
            column: filterColumn,
            filter: filterValue
        })
        updateTable()
    }
</script>
<section>
    {#key update}
        {#await table.getData()}
            <p>Loading...</p>
        {:then data}
            <table>
                <tr>
                    {#each data.scheme as info}
                        <th>
                            <button on:click={() => {
                                updateSorting(info.column)
                            }} class="table-head">
                                <p>{info.column}</p>
                                {#if $sorting.filter(obj => obj.column == info.column)[0].times == 0}
                                    <img src="/no-filter.svg" alt="No filter icon"/>
                                {:else if $sorting.filter(obj => obj.column == info.column)[0].times == 1}
                                    <img src="/ascending-filter.svg" alt="Ascending filter icon"/>
                                {:else if $sorting.filter(obj => obj.column == info.column)[0].times == 2}
                                    <img src="/descending-filter.svg" alt="Descending filter icon"/>
                                {:else}
                                    <p>Something went wrong!</p>
                                {/if}
                            </button>
                            <input on:change={updateFiltering} class="input-filtering" type={info.type == 0? 'text': info.type == 1? 'number': 'checkbox'} placeholder="filter by {info.column}">
                        </th>
                    {/each}
                </tr>
                {#each Array(data.data.length - ($pagination.rowsPerPage * ($pagination.currentPage)) > 0? $pagination.rowsPerPage : $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - data.data.length) ) as _, i}
                    <tr class="row">
                        {#each data.data[i + ($pagination.rowsPerPage * ($pagination.currentPage - 1))] as row}
                            <td>{row}</td>
                        {/each}
                    </tr>
                {/each}
            </table>
            <section class="table-information">
                <div class="table-rows">
                    <p>Rows: </p>
                    <select bind:value={$rows} class="table-rows-select" name="rows" id="rows" on:change={() => updateRowsPerPage()}>
                        <option value=10>10</option>
                        <option value=20>20</option>
                        <option value=50>50</option>
                        <option value=100>100</option>
                    </select>
                    <p>{($pagination.rowsPerPage * $pagination.currentPage) + 1 - $pagination.rowsPerPage}-{data.data.length - ($pagination.rowsPerPage * ($pagination.currentPage)) > 0? $pagination.rowsPerPage : $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - data.data.length) + ($pagination.rowsPerPage * ($pagination.currentPage - 1))} of {data.data.length}</p>
                </div>
                <div class="pagination">
                    <button on:click={() => changePage($pagination.currentPage - 1)} class="arrow-button"><img src="/arrow-left.svg" alt="Arrow left"></button >
                    {#each Array($pagination.totalPages) as _, i}
                        <button on:click={() => {changePage(i+1)}} class="pagination-page">
                            <p>{i + 1}</p>
                        </button>
                    {/each}
                    <button on:click={() => changePage($pagination.currentPage + 1)} class="arrow-button"><img src="/arrow-right.svg" alt="Arrow right"></button >
                </div>
            </section>
        {/await}
    {/key}
</section>

<style>
    table {
        border-spacing: 0;
        width: 100%;
    }

    td {
        padding: 1rem;
    }
    
    th {
        width: max-content
    }

    .table-head {
        display: flex;
        align-items: center;
        padding: 0.5rem 0.5rem 0;
        gap: 0.5rem;
        border: none;
        background-color: inherit;
        cursor: pointer;
    }

    .table-head:hover {
        background-color: #e2e8f0;
    }

    .row:nth-child(2n+1) {
        background-color: inherit;
    }
    .row:nth-child(2n) {
        background-color: #e2e8f0
    }

    .table-information {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .table-rows {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .table-rows-select {
        padding: 0.5rem;
    }

    .pagination {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .pagination-page {
        border: none;
        background-color: inherit;
        cursor: pointer;
    }

    .pagination-page:hover {
        font-weight: 800;
    }
    
    .arrow-button {
        background-color: inherit;
        border: none;
        cursor: pointer;
    }

    .input-filtering {
        width: 60%;
        display: flex;
        align-self: flex-start;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
    }
</style>