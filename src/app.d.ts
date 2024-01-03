declare global {
  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:outClick'?: (event: CustomEvent) => void
      'on:storeoptions'?: (event: CustomEvent) => void
      'on:repositioned'?: (event: CustomEvent) => void
      'on:resizing'?: (event: CustomEvent) => void
      'on:saveKey'?: (event: CustomEvent) => void
      'on:escapeKey'?: (event: CustomEvent) => void
    }
  }
}

export {}
