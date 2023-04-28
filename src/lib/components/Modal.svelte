<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import SvgIcon from './SvgIcon.svelte'
  import type { CustomTableEvents } from './DataTable'
  export let show: boolean

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function onClick() {
    dispatch('settingsVisibilityChanged', { visibility: false })
  }
</script>

{#if show == true}
  <section data-component="modal-container-medium">
    <div data-component="modal">
      <button data-component="close" on:click={onClick}
        ><SvgIcon href="icons.svg" id="x" height="16px" width="16px" /></button
      >
      <div data-component="modal-content"><slot /></div>
    </div>
  </section>
{/if}