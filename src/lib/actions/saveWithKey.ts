export function saveWithKey(node: Node) {
  const handelSave = (e: Event) => {
    const event = e as KeyboardEvent
    if (event.key === 'Enter') node.dispatchEvent(new CustomEvent('saveKey'))
  }

  node.addEventListener('keypress', handelSave, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handelSave, true)
    },
  }
}
