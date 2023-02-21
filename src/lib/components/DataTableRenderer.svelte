<script lang="ts">
    import type ITable from "../interfaces/ITable";
    import { sorting, pagination } from "$lib/store"

    export let table: ITable;

    const updateSorting = (col: string) => {
        /*
            Update the column sort
        */
        table.setColumnSort({
            column: col,
            direction: $sorting.filter(obj => obj.column == col)[0].times + 1
        })
    }

    const changePage = (page: number) => {
        /*
            Update the pagination
        */
        table.setTablePagination({
            currentPage: page,
            totalPages: $pagination.totalPages,
            rowsPerPage: $pagination.rowsPerPage
        })
    }
</script>
<section>
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
                        </th>
                    {/each}
                </tr>
                {#each Array($pagination.rowsPerPage) as _, i}
                <tr class="row">
                    {#each data.data[i] as cell}
                        <td>{cell}</td>
                    {/each}
                </tr>
                {/each}
            </table>
            <div class="pagination">
                <img src="/arrow-left.svg" alt="Arrow left">
                {#each Array($pagination.totalPages) as _, i}
                    <button on:click={() => {changePage(i+1)}} class="pagination-page">
                        {i + 1}
                    </button>
                {/each}
                <img src="/arrow-right.svg" alt="Arrow right">
            </div>
        {/await}
</section>
<style>
    table {
        border-spacing: 0;
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
        padding: 1rem;
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
</style>