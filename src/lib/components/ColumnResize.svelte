<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { resizableColumn } from '../actions/resizableColumn'
  import { repositionableColumn } from '../actions/repositionableColumn'
  import type { ColumnPositionChangedED, IColumnResizeProps } from '../interfaces/Types'
    import columns from '$lib/helpers/columns/Columns.svelte'

  let { column, minWidth = 10, child }: IColumnResizeProps = $props()

  const onRepositioned = (e: CustomEvent<ColumnPositionChangedED>) => {
    const { column, position } = e.detail
    columns.changeColumnsPosition(column, position)
  }

  function onResizing(e: CustomEvent<{ x: number }>) {
    if (!column.width) return
    const width = column.width + e.detail.x
    if (width > minWidth) columns.changeColumnWidth(column.id, width)
  }
</script>

{#if column}
  {@const { repositionable, resizable } = column}
  {@const draggable = repositionable !== false}
  <div data-name="column-resize">
    <div data-name="column-reposition" {draggable} use:repositionableColumn={column} onrepositioned={onRepositioned}>
      {@render child()}
    </div>
    {#if resizable !== false}
      <div data-name="column-resize-left" use:resizableColumn onresizing={onResizing}></div>
    {/if}
  </div>
{/if}
