<script lang="ts">
  import Loader from '../extra/Loader.svelte'
  import TableBodyRow from './TableBodyRow.svelte'
  import type { ITableBodyProps } from '../../../interfaces/Types'

  let { addRowChild, rowChild, actionCellChild, loadingChild, noDataChild, dt }: ITableBodyProps = $props()

  $effect(() => {
    console.log(dt?.renderedData)
  })
</script>

<tbody>
  {#if dt && dt?.renderedData}
    {@const { renderedData, originalIndices } = dt}
    {@const { visibleOrderedColumns } = dt}
    {@const { internalOptions } = dt}
    {#if internalOptions.addRow === 'top' && addRowChild}
      {@render addRowChild(visibleOrderedColumns, dt.internalOptions)}
    {/if}
    {#each renderedData as row, i (i)}
      <tr data-index={i}>
        {#if rowChild}
          {@render rowChild(row, (originalIndices ?? [])[i], i, visibleOrderedColumns, internalOptions)}
        {:else}
          <TableBodyRow {row} index={i} {actionCellChild} {dt} />
        {/if}
      </tr>
    {/each}
    {#if internalOptions.addRow === 'bottom' && addRowChild}
      {@render addRowChild(visibleOrderedColumns, internalOptions)}
    {/if}
  {:else if dt}
    <Loader {loadingChild} {dt} />
  {:else if noDataChild}
    {@render noDataChild()}
  {/if}
</tbody>
