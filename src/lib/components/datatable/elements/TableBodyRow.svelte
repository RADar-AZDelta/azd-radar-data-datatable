<script lang="ts">
  import { flip } from 'svelte/animate'
  import type { ITableBodyRowProps } from '../../../interfaces/Types'

  let { row: renderedRow, index, actionCellChild, dt }: ITableBodyRowProps = $props()
</script>

{#if dt}
  {@const { visibleOrderedColumns, internalOptions: options } = dt}
  {@const columns = visibleOrderedColumns ?? []}
  {#if options?.actionColumn}
    {#if actionCellChild}
      {@const originalIndex = dt?.originalIndices?.[index] ?? -1}
      {@render actionCellChild({ renderedRow, originalIndex, index, columns, options })}
    {:else}
      <td></td>
    {/if}
  {/if}
  {#each columns as column (column.id)}
    <td animate:flip={{ duration: 500 }}><p>{renderedRow[column.id]}</p></td>
  {/each}
{/if}
