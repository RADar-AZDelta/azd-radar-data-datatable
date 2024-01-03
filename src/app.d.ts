// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  namespace svelte.JSX {
    interface HTMLAttributes {
      onsaveKey: (e: CustomEvent) => void
      onoutClick: (e: CustomEvent) => void
      onescapeKey: (e: CustomEvent) => void
      onstoreoptions: (e: CustomEvent) => void
    }
  }

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
