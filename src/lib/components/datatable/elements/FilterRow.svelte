<script lang="ts">
  import { flip } from 'svelte/animate'
  import options from '../../../helpers/Options.svelte'
  import ColumnFilter from './column/ColumnFilter.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import type { IFilterRowProps } from '../../../interfaces/Types'

  let { actionHeaderChild }: IFilterRowProps = $props()

  let filterVisibility = $state<boolean>(options.internalOptions.hideFilters ?? true)
</script>

{#if filterVisibility}
  <tr data-name="filters">
    {#if options.internalOptions.actionColumn}
      {#if actionHeaderChild}
        {@render actionHeaderChild(columns.visibleOrderedColumns ?? [], options.internalOptions)}
      {:else}
        <th></th>
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
