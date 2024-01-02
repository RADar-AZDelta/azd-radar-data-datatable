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
}

export {}
