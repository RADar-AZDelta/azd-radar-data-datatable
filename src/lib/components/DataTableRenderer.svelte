<script lang="ts">
    import type { ColumnMetadata } from "../classes/ColumnMetadata";

    export let data: any[];

    export let columns: ColumnMetadata
</script>
{#each data as row}
    <div class="row">
        {#each row as cell}
            <div class="cell">
                {cell}
            </div>
        {/each}
    </div>
{/each}