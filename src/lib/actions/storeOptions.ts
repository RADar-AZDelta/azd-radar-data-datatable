export function storeOptions(node: Node) {
  const handleBeforeUnload = () => {
    node.dispatchEvent(new CustomEvent('storeoptions'))
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') node.dispatchEvent(new CustomEvent('storeoptions'))
  }

  window.addEventListener('beforeunload', handleBeforeUnload, true)
  document.addEventListener('visibilitychange', handleVisibilityChange, true)

  return {
    destroy() {
      window.removeEventListener('beforeunload', handleBeforeUnload, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange, true)
    },
  }
}
