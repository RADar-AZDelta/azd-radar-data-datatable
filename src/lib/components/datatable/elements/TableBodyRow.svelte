<script lang="ts">
  import { flip } from 'svelte/animate'
  import data from '../../../helpers/Data.svelte'
  import options from '../../../helpers/Options.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import type { ITableBodyRowProps } from '../../../interfaces/Types'

  let { row, index, actionCellChild }: ITableBodyRowProps = $props()
</script>

{#if options.internalOptions.actionColumn}
  {#if actionCellChild}
    {@render actionCellChild(row, data.originalIndices[index], index, columns.visibleOrderedColumns, options.internalOptions)}
  {:else}
    <td></td>
  {/if}
{/if}
{#each columns.visibleOrderedColumns as column, j (j)}
  <td animate:flip={{ duration: 500 }}><p>{row[column.id]}</p></td>
{/each}
