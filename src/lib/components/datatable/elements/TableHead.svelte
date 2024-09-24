<script lang="ts">
  import type { ITableHeadProps } from '../../../interfaces/Types'
  import ExtraLayer from '../extra/ExtraLayer.svelte'
  import options from '../../../helpers/Options.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import SvgIcon from '../../general/SvgIcon.svelte'
  import { flip } from 'svelte/animate'
  import ColumnResize from './column/ColumnResize.svelte'
  import ColumnSort from './column/ColumnSort.svelte'
  import ColumnFilter from './column/ColumnFilter.svelte'

  let { paginationChanged, actionHeaderChild }: ITableHeadProps = $props()

  let filterVisibility = $state<boolean>(options.internalOptions.hideFilters ?? true)

  function toggleFilterVisibility() {
    filterVisibility = !filterVisibility
    for (let col of columns.internalColumns ?? []) col.filterable = filterVisibility
  }
</script>

<thead>
  {#if options.internalOptions}
    {@const { paginationOnTop, hideOptions, hidePagination, actionColumn, singleSort } = options.internalOptions}
    {#if paginationOnTop && (!hideOptions || !hidePagination)}
      <ExtraLayer {paginationChanged} />
    {/if}
    <tr data-name="titles">
      {#if actionColumn}
        <th data-name="action-Column">
          {#if singleSort}
            <button onclick={toggleFilterVisibility}><SvgIcon id="filter" /></button>
          {/if}
        </th>
      {/if}
      {#each columns.visibleOrderedColumns ?? [] as column, i (column.id)}
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
    {#if filterVisibility}
      <tr data-name="filters">
        {#if actionColumn}
          {#if actionHeaderChild}
            {@render actionHeaderChild(columns.visibleOrderedColumns ?? [], options.internalOptions)}
          {:else}
            <!-- svelte-ignore element_invalid_self_closing_tag -->
            <th />
          {/if}
        {/if}
        {#if options.internalOptions.globalFilter}
          {@const { column, filter } = options.internalOptions.globalFilter}
          <th colspan={(columns.visibleOrderedColumns ?? []).length}>
            <ColumnFilter column={column ?? 'all'} inputType="text" {filter} />
          </th>
        {:else}
          {#each columns.visibleOrderedColumns ?? [] as column, i (column.id)}
            {@const { resizable, id, filterable, filter } = column}
            <th data-resizable={resizable} data-key={id} data-filterable={filterable} animate:flip={{ duration: 500 }}>
              {#if filterable !== false}
                <ColumnFilter column={id} inputType="text" {filter} />
              {/if}
            </th>
          {/each}
        {/if}
      </tr>
    {/if}
  {/if}
</thead>
