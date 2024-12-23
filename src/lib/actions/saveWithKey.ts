export function saveWithKey(node: Node) {
  const handelSave = (e: KeyboardEvent) => {
    if (e.key === 'Enter') node.dispatchEvent(new CustomEvent('saveKey'))
  }

  node.addEventListener('keypress', handelSave, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handelSave, true)
    },
  }
}
