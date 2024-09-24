<script lang="ts">
  import { flip } from 'svelte/animate'
  import options from '../../../helpers/Options.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import ColumnResize from './column/ColumnResize.svelte'
  import ColumnSort from './column/ColumnSort.svelte'
  import SvgIcon from '../../general/SvgIcon.svelte'

  let filterVisibility = $state<boolean>(options.internalOptions.hideFilters ?? true)

  function toggleFilterVisibility() {
    filterVisibility = !filterVisibility
    for (let col of columns.internalColumns ?? []) col.filterable = filterVisibility
  }
</script>

<tr data-name="titles">
  {#if options.internalOptions.actionColumn}
    <th data-name="action-Column">
      {#if options.internalOptions.singleSort}
        <button onclick={toggleFilterVisibility}><SvgIcon id="filter" /></button>
      {/if}
    </th>
  {/if}
  {#each columns.visibleOrderedColumns ?? [] as column, _ (column.id)}
    {@const { id, sortDirection, resizable, sortable } = column}
    <th title={id} data-direction={sortDirection} data-resizable={resizable} data-key={id} data-sortable={sortable} animate:flip={{ duration: 500 }}>
      <ColumnResize {column}>
        {#snippet child()}
          <p>{column.label || column.id}</p>
          {#if column.sortable !== false}
            <ColumnSort column={column.id} sortDirection={column.sortDirection} disabled={options.disabled} />
          {/if}
        {/snippet}
      </ColumnResize>
    </th>
  {/each}
</tr>
