<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ColumnPositionChangedEventDetail, CustomTableEvents, IColumnMetaData } from './DataTable'
  import { resizableColumn } from '../actions/resizableColumn'
  //import { repositionableColumn } from '$lib/actions/repositionableColumn'

  export let column: IColumnMetaData,
    columnResizing: boolean = false,
    minWidth: number = 10
  let w: number

  const dispatch = createEventDispatcher<CustomTableEvents>()

  // $: {
  //   console.log(`columnResizing: ${columnResizing}`)
  // }

  // function onRepositioned(event: CustomEvent<ColumnPositionChangedEventDetail>) {
  //   dispatch('columnPositionChanged', event.detail)
  // }

  function dragstart(event: DragEvent) {
    if (column.repositionable === false || columnResizing) return
    console.log('dragstart')
    const data = { column: column.id }
    event.dataTransfer!.setData('text/plain', JSON.stringify(data))
  }

  function dragover(event: DragEvent) {
    if (column.repositionable === false || columnResizing) return
    event.preventDefault()
  }

  function drop(event: DragEvent) {
    if (column.repositionable === false || columnResizing) return
    event.preventDefault()
    try {
      const json = event.dataTransfer!.getData('text/plain')
      const data = JSON.parse(json)
      dispatch('columnPositionChanged', { column: data.column, position: column.position ?? Number.MAX_SAFE_INTEGER })
    } catch {}
  }

  function onResizing(event: CustomEvent<{ x: number; done?: boolean }>) {
    const width = w + event.detail.x
    if (width > minWidth) dispatch('columnWidthChanged', { column: column.id, width, done: event.detail.done })
  }
</script>

<div data-name="column-resize" bind:clientWidth={w}>
  <!-- {#if column.resizable !== false}
    <div data-name="column-resize-right" use:resizableColumn on:resizing={onResizing} />
  {/if} -->
  <div
    data-name="column-reposition"
    draggable={column.repositionable !== false && !columnResizing}
    on:dragstart={dragstart}
    on:dragover={dragover}
    on:drop={drop}
  >
    <!-- use:repositionableColumn={(column, columnResizing)}
  on:repositioned={onRepositioned} -->
    <slot />
  </div>
  {#if column.resizable !== false}
    <div data-name="column-resize-left" use:resizableColumn on:resizing={onResizing} />
  {/if}
</div>
