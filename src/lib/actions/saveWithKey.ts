export function saveWithKey(node: Node) {
  const handelSave = (e: KeyboardEvent) => {
    e.key === 'Enter' ? node.dispatchEvent(new CustomEvent('saveKey')) : null
  }

  document.addEventListener('keydown', handelSave, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handelSave, true)
    },
  }
}
