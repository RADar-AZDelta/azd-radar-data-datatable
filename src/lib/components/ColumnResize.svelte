<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { dev } from '$app/environment'
  import { createEventDispatcher } from 'svelte'
  import type { CustomTableEvents, IColumnMetaData } from './DataTable'

  export let column: IColumnMetaData

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function dragStart(event: DragEvent) {
    if (column.repositionable === false) return
    if (dev) console.log(`DataTable: drag start column ${column.id}`)
    const data = { column: column.id }
    event.dataTransfer!.setData('text/plain', JSON.stringify(data))
  }

  function dragover(event: DragEvent) {
    if (column.repositionable === false) return
    event.preventDefault()
  }

  function drop(event: DragEvent) {
    if (column.repositionable === false) return
    event.preventDefault()
    try {
      const json = event.dataTransfer!.getData('text/plain')
      const data = JSON.parse(json)
      if (dev) console.log(`DataTable: drop column ${data.column}`)
      dispatch('columnPositionChanged', { column: data.column, position: column.position ?? Number.MAX_SAFE_INTEGER })
    } catch {}
  }
</script>

<div
  draggable={column.repositionable !== false}
  on:dragstart={event => dragStart(event)}
  on:dragover={event => dragover(event)}
  on:drop={event => drop(event)}
>
  <slot />
  {#if column.resizable !== false}
    <div
      data-name="column-resize"
      draggable="true"
      on:dragover={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
    />
  {/if}
</div>
