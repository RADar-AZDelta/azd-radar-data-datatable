<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ColumnPositionChangedEventDetail, CustomTableEvents, IColumnMetaData } from './DataTable'
  import { resizableColumn } from '../actions/resizableColumn'
  import { repositionableColumn } from '$lib/actions/repositionableColumn'

  export let column: IColumnMetaData,
    minWidth: number = 10
  let w: number

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function onRepositioned(event: CustomEvent<ColumnPositionChangedEventDetail>) {
    dispatch('columnPositionChanged', event.detail)
  }

  function onResizing(event: CustomEvent<{ x: number }>) {
    const width = w + event.detail.x
    if (width > minWidth) dispatch('columnWidthChanged', { column: column.id, width })
  }
</script>

<div data-name="column-resize" bind:clientWidth={w}>
  <!-- {#if column.resizable !== false}
    <div data-name="column-resize-right" use:resizableColumn on:resizing={onResizing} />
  {/if} -->
  <div
    data-name="column-reposition"
    draggable={column.repositionable !== false}
    use:repositionableColumn={column}
    on:repositioned={onRepositioned}
  >
    <slot />
  </div>
  {#if column.resizable !== false}
    <div data-name="column-resize-left" use:resizableColumn on:resizing={onResizing} />
  {/if}
</div>
