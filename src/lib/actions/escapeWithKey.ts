export function escapeWithKey(node: Node) {
  const handleEscape = (e: KeyboardEvent) => {
    e.key === 'Escape' ? node.dispatchEvent(new CustomEvent('escapeKey')) : null
  }

  document.addEventListener('keydown', handleEscape, true)

  return {
    destroy() {
      document.removeEventListener('keypress', handleEscape, true)
    },
  }
}
