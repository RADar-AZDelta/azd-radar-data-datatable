<script lang="ts">
  import { flip } from 'svelte/animate'
  import type { ITableBodyRowProps } from '../../../interfaces/Types'

  let { row, index, actionCellChild, dt }: ITableBodyRowProps = $props()
</script>

{#if dt?.internalOptions?.actionColumn}
  {#if actionCellChild}
    {@render actionCellChild(row, dt?.originalIndices?.[index] ?? -1, index, dt?.visibleOrderedColumns, dt?.internalOptions)}
  {:else}
    <td></td>
  {/if}
{/if}
{#each dt?.visibleOrderedColumns ?? [] as column, j (j)}
  <td animate:flip={{ duration: 500 }}><p>{row[column.id]}</p></td>
{/each}
