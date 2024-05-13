declare global {
  namespace svelteHTML {
    interface HTMLAttributes<T> {
      onoutClick?: (event: CustomEvent) => void
      onstoreoptions?: (event: CustomEvent) => void
      onrepositioned?: (event: CustomEvent) => void
      onresizing?: (event: CustomEvent) => void
      onsaveKey?: (event: CustomEvent) => void
      onescapeKey?: (event: CustomEvent) => void
    }
  }
}

export {}
