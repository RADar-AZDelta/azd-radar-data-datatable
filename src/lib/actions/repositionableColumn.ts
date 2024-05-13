import type { IColumnMetaData } from '$lib/interfaces/Types'

export function repositionableColumn(node: Node, column: IColumnMetaData) {
  function handleDragStart(event: DragEvent) {
    if (column.repositionable === false || !event.dataTransfer) return
    const data = { column: column.id }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  function handleDragOver(event: DragEvent) {
    if (column.repositionable === false) return
    event.preventDefault()
  }

  function handleDrop(event: DragEvent) {
    if (column.repositionable === false || !event.dataTransfer) return
    event.preventDefault()
    try {
      const json = event.dataTransfer!.getData('text/plain')
      const data = JSON.parse(json)

      node.dispatchEvent(
        new CustomEvent('repositioned', {
          detail: { column: data.column, position: column.position ?? Number.MAX_SAFE_INTEGER },
        })
      )
    } catch (e) {
      console.error(e)
    }
  }

  node.addEventListener('dragstart', handleDragStart, true)
  node.addEventListener('dragover', handleDragOver, true)
  node.addEventListener('drop', handleDrop, true)

  return {
    destroy() {
      node.removeEventListener('dragstart', handleDragStart, true)
      node.removeEventListener('dragover', handleDragOver, true)
      node.removeEventListener('drop', handleDrop, true)
    },
  }
}
