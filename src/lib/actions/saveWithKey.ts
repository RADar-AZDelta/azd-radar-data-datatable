export function saveWithKey(node: Node) {
  const handelSave = (e: KeyboardEvent) => {
    if (e.key === 'Enter') node.dispatchEvent(new CustomEvent('saveKey'))
  }

  document.addEventListener('keydown', handelSave, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handelSave, true)
    },
  }
}
