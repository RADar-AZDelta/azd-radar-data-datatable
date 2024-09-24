export function resizableColumn(node: Node) {
  let x: number
  let nodeWidth: number

  function handleMousedown(evt: Event): void {
    x = (evt as MouseEvent).clientX
    nodeWidth = evt.currentTarget ? (evt.currentTarget as Node).parentNode?.children[0].getBoundingClientRect().width ?? 30 : 30
    dispatch(0)

    window.addEventListener('mousemove', handleMousemove)
    window.addEventListener('mouseup', handleMouseup)
  }

  function handleMousemove(event: MouseEvent) {
    const dx = event.clientX - x
    x = event.clientX
    dispatch(dx)
  }

  function handleMouseup(event: MouseEvent) {
    const dx = event.clientX - x
    dispatch(dx)

    window.removeEventListener('mousemove', handleMousemove)
    window.removeEventListener('mouseup', handleMouseup)
  }

  const dispatch = (x: number) => node.dispatchEvent(new CustomEvent('resizing', { detail: { x, width: nodeWidth } }))

  node.addEventListener('mousedown', handleMousedown)

  return {
    destroy() {
      node.removeEventListener('mousedown', handleMousedown)
    },
  }
}
