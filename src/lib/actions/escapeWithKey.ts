export function escapeWithKey(node: Node) {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') node.dispatchEvent(new CustomEvent('escapeKey'))
  }

  document.addEventListener('keydown', handleEscape, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handleEscape, true)
    },
  }
}
