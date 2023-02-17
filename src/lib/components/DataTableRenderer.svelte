<script lang="ts">
    import type { ColumnMetadata } from "../classes/ColumnMetadata";
    import type ITable from "../interfaces/ITable";
    import type IPaginated from "../interfaces/IPaginated";
    import type {ISort} from "../interfaces/ISort";
    import type {IFilter} from "../interfaces/IFilter";

    export let table: ITable;
    let columnFilters: IFilter[];
    let columnSorts: ISort[];
    let tablePagination: IPaginated;
    // export let data: any[];

    // export let columns: ColumnMetadata
</script>
<table>
<!--
    getData(columnFilters?: IFilter[], columnSorts?: ISort[], tablePagination?: IPaginated): Promise<ITableData>;-->
    {#await table.getData()}
        <tr>
            <td>Loading...</td>
        </tr>
    {:then data}
        <h1>Hi!</h1>
        <script>
            console.log("\n\n\n\n\n\n\n\n\n\n\n"+data);
        </script>
        {#each data[0] as col}
            <th>{col[0]}</th>
        {/each}
        {#each data as row}
            <tr class="row">
                {#each row as cell}
                    <td class="cell">
                        {cell[1]}
                    </td>
                {/each}
            </tr>
        {/each}
    {/await}
    <!--{#each data[0] as col}-->
    <!--    <th>{col[0]}</th>-->
    <!--{/each}-->
    <!--{#each data as row}-->
    <!--    <tr class="row">-->
    <!--        {#each row as cell}-->
    <!--            <td class="cell">-->
    <!--                {cell[1]}-->
    <!--            </td>-->
    <!--        {/each}-->
    <!--    </tr>-->
    <!--{/each}-->
</table>
<style>
    table {
        border-spacing: 0;
    }
    .row:first-child {
        background-color: rgba(0,255,0,0.41);
    }
    .row:nth-child(even) {
        background-color: rgba(255,0,216,0.41);
    }
    .row:nth-child(odd) {
        background-color: rgba(100,0,255,0.41);
    }
    .cell {
        padding-right: 10px;
    }
</style>