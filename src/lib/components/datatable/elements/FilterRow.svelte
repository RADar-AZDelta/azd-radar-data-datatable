<script lang="ts">
  import { flip } from 'svelte/animate'
  import ColumnFilter from '../../../components/datatable/elements/column/ColumnFilter.svelte'
  import type { IFilterRowProps } from '../../../interfaces/Types'

  let { actionHeaderChild, dt }: IFilterRowProps = $props()

  let filterVisibility = $derived<boolean>(dt?.internalOptions.hideFilters ?? true)
</script>

{#if filterVisibility && dt}
  {@const { visibleOrderedColumns, internalOptions: options } = dt}
  {@const columns = visibleOrderedColumns ?? []}
  <tr data-name="filters">
    {#if options.actionColumn}
      {#if actionHeaderChild}
        {@render actionHeaderChild({ columns, options })}
      {:else}
        <th></th>
      {/if}
    {/if}
    {#if options.globalFilter}
      {@const { column, filter } = options.globalFilter}
      <th colspan={columns.length}>
        <ColumnFilter column={column ?? 'all'} inputType="text" {filter} {dt} />
      </th>
    {:else}
      {#each columns as column (column.id)}
        {@const { resizable, id, filterable, filter } = column}
        <th data-resizable={resizable} data-key={id} data-filterable={filterable} animate:flip={{ duration: 500 }}>
          {#if filterable !== false}
            <ColumnFilter column={id} inputType="text" {filter} {dt} />
          {/if}
        </th>
      {/each}
    {/if}
  </tr>
{/if}
