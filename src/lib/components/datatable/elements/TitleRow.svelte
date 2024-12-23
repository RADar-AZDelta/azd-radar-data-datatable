<script lang="ts">
  import { flip } from 'svelte/animate'
  import SvgIcon from '../../../components/general/SvgIcon.svelte'
  import ColumnResize from '../../../components/datatable/elements/column/ColumnResize.svelte'
  import ColumnSort from '../../../components/datatable/elements/column/ColumnSort.svelte'
  import type { ITitleRowProps } from '../../../interfaces/Types'

  let { dt }: ITitleRowProps = $props()

  let filterVisibility = $state<boolean>(dt?.internalOptions.hideFilters ?? true)

  function toggleFilterVisibility() {
    filterVisibility = !filterVisibility
    for (let col of dt?.internalColumns ?? []) col.filterable = filterVisibility
  }
</script>

<tr data-name="titles">
  {#if dt?.internalOptions.actionColumn}
    <th data-name="action-Column">
      {#if dt?.internalOptions.singleSort}
        <button onclick={toggleFilterVisibility}><SvgIcon id="filter" /></button>
      {/if}
    </th>
  {/if}
  {#each dt?.visibleOrderedColumns ?? [] as column (column.id)}
    {@const { id, sortDirection, resizable, sortable } = column}
    <th title={id} data-direction={sortDirection} data-resizable={resizable} data-key={id} data-sortable={sortable} animate:flip={{ duration: 500 }}>
      <ColumnResize {column} {dt}>
        {#snippet child()}
          <p>{column.label || column.id}</p>
          {#if column.sortable !== false}
            <ColumnSort column={column.id} sortDirection={column.sortDirection} disabled={dt?.disabled ?? false} {dt} />
          {/if}
        {/snippet}
      </ColumnResize>
    </th>
  {/each}
</tr>
