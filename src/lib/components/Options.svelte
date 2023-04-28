<script lang="ts">
  import SvgIcon from './SvgIcon.svelte'
  import type { CustomTableEvents } from './DataTable'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function onClick() {
    dispatch('settingsVisibilityChanged', { visibility: true })
  }
</script>

<button on:click={onClick}><SvgIcon href="icons.svg" id="gear" width="16px" height="16px" /></button>
