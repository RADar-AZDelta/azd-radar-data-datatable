<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { resizableColumn } from '../../../../actions/resizableColumn'
  import { repositionableColumn } from '../../../../actions/repositionableColumn'
  import type { ColumnPositionChangedED, IColumnResizeProps } from '../../../../interfaces/Types'

  let { column, minWidth = 10, child, dt }: IColumnResizeProps = $props()

  const onRepositioned = (e: CustomEvent<ColumnPositionChangedED>) => {
    const { column, position } = e.detail
    dt?.changeColumnsPosition(column, position)
  }

  function onResizing(e: CustomEvent<{ x: number; width: number }>) {
    const columnWidth = column.width ?? e.detail.width
    if (!columnWidth) return
    const width = columnWidth + e.detail.x
    if (width > minWidth) dt?.changeColumnWidth(column.id, width)
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
