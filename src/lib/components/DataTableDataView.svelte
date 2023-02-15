<script lang="ts">
    import {ColumnMetadata} from "../classes/ColumnMetadata";

    export let data;



    export let columns: ColumnMetadata
</script>
<h1>adf</h1>

{#each data as row}
    <div class="row">
        {#each row as cell}
            <div class="cell">
                {cell}
            </div>
        {/each}
    </div>
{/each}