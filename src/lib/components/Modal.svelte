<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import SvgIcon from './SvgIcon.svelte'
  import type { CustomTableEvents } from './DataTable'
  import { fade } from 'svelte/transition'
  import { clickOutside } from '../actions/clickOutside.js'

  export let show: boolean = false

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function onClickOutside() {
    dispatch('settingsVisibilityChanged', { visibility: false })
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <section data-component="modal-container-medium" in:fade out:fade>
    <div data-component="modal" use:clickOutside on:outclick={onClickOutside}>
      <button data-component="close" on:click={onClick}
        ><SvgIcon href="icons.svg" id="x" height="16px" width="16px" /></button
      >
      <div data-component="modal-content"><slot /></div>
    </div>
  </section>
{/if}
