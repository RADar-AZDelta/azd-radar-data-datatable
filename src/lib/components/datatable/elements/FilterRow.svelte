<script lang="ts">
  import { flip } from 'svelte/animate'
  import ColumnFilter from '@dtlib/components/datatable/elements/column/ColumnFilter.svelte'
  import type { IFilterRowProps } from '@dtlib/interfaces/Types'

  let { actionHeaderChild, dt }: IFilterRowProps = $props()

  let filterVisibility = $derived<boolean>(dt?.internalOptions.hideFilters ?? true)
</script>

{#if filterVisibility}
  <tr data-name="filters">
    {#if dt?.internalOptions.actionColumn}
      {#if actionHeaderChild}
        {@render actionHeaderChild(dt?.visibleOrderedColumns ?? [], dt?.internalOptions)}
      {:else}
        <th></th>
      {/if}
    {/if}
    {#if dt?.internalOptions.globalFilter}
      {@const { column, filter } = dt?.internalOptions.globalFilter}
      <th colspan={(dt?.visibleOrderedColumns ?? []).length}>
        <ColumnFilter column={column ?? 'all'} inputType="text" {filter} {dt} />
      </th>
    {:else}
      {#each dt?.visibleOrderedColumns ?? [] as column, i (column.id)}
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
