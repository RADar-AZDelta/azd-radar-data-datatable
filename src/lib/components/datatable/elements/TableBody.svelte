<script lang="ts">
  import Loader from '../../../components/datatable/extra/Loader.svelte'
  import TableBodyRow from '../../../components/datatable/elements/TableBodyRow.svelte'
  import type { ITableBodyProps } from '../../../interfaces/Types'

  let { addRowChild, rowChild, actionCellChild, loadingChild, noDataChild, dt }: ITableBodyProps = $props()
</script>

<tbody>
  {#if dt && dt?.renderedData}
    {@const { renderedData, originalIndices, internalOptions: options, visibleOrderedColumns } = dt}
    {@const columns = visibleOrderedColumns ?? []}
    {#if options.addRow === 'top' && addRowChild}
      {@render addRowChild({ columns, options })}
    {/if}
    {#each renderedData as renderedRow, index (index)}
      <tr data-index={index}>
        {#if rowChild}
          {@render rowChild({ renderedRow, originalIndex: (originalIndices ?? [])[index], index, columns, options })}
        {:else}
          <TableBodyRow row={renderedRow} {index} {actionCellChild} {dt} />
        {/if}
      </tr>
    {/each}
    {#if options.addRow === 'bottom' && addRowChild}
      {@render addRowChild({ columns, options })}
    {/if}
  {:else if dt}
    <Loader {loadingChild} {dt} />
  {:else if noDataChild}
    {@render noDataChild()}
  {/if}
</tbody>
