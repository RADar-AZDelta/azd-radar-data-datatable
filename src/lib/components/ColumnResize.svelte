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

  const onRepositioned = (event: CustomEvent<ColumnPositionChangedED>) =>
    dispatch('columnPositionChanged', event.detail)

  function onResizing(event: CustomEvent<{ x: number }>) {
    const width = column.width! + event.detail.x
    if (width > minWidth) dispatch('columnWidthChanged', { column: column.id, width })
  }
</script>

<div data-name="column-resize">
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
