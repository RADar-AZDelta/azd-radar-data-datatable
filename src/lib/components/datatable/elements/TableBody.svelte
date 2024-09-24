<script lang="ts">
  import type { ITableBodyProps } from '../../../interfaces/Types'
  import options from '../../../helpers/Options.svelte'
  import data from '../../../helpers/data/Data.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import Loader from '../extra/Loader.svelte'
  import TableBodyRow from './TableBodyRow.svelte'

  let { addRowChild, rowChild, actionCellChild, loadingChild, noDataChild }: ITableBodyProps = $props()
</script>

<tbody>
  {#if data.renderedData}
    {@const { renderedData, originalIndices } = data}
    {@const { visibleOrderedColumns } = columns}
    {@const { internalOptions } = options}
    {#if internalOptions.addRow === 'top' && addRowChild}
      {@render addRowChild(visibleOrderedColumns, options.internalOptions)}
    {/if}
    {#each data.renderedData as row, i (i)}
      <tr data-index={i}>
        {#if rowChild}
          {@render rowChild(row, (originalIndices ?? [])[i], i, visibleOrderedColumns, internalOptions)}
        {:else}
          <TableBodyRow {row} index={i} {actionCellChild} />
        {/if}
      </tr>
    {/each}
    {#if internalOptions.addRow === 'bottom' && addRowChild}
      {@render addRowChild(visibleOrderedColumns, internalOptions)}
    {/if}
  {:else if data}
    <Loader {loadingChild} />
  {:else if noDataChild}
    {@render noDataChild()}
  {/if}
</tbody>
