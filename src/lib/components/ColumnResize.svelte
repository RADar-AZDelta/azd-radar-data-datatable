<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { resizableColumn } from '$lib/actions/resizableColumn'
  import { repositionableColumn } from '$lib/actions/repositionableColumn'
  import type { ColumnPositionChangedED, CustomTableEvents, IColumnMetaData } from './DataTable'

  export let column: IColumnMetaData
  export let minWidth: number = 10

  const dispatch = createEventDispatcher<CustomTableEvents>()

  const onRepositioned = (e: CustomEvent<ColumnPositionChangedED>) => dispatch('columnPositionChanged', e.detail)

  function onResizing(e: CustomEvent<{ x: number }>) {
    if (!column.width) return
    const width = column.width + e.detail.x
    if (width > minWidth) dispatch('columnWidthChanged', { column: column.id, width })
  }
</script>

{#if column}
  {@const { repositionable, resizable } = column}
  {@const draggable = repositionable !== false}
  <div data-name="column-resize">
    <div data-name="column-reposition" {draggable} use:repositionableColumn={column} on:repositioned={onRepositioned}>
      <slot />
    </div>
    {#if resizable !== false}
      <div data-name="column-resize-left" use:resizableColumn on:resizing={onResizing} />
    {/if}
  </div>
{/if}
