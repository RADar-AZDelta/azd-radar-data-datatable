<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import type { CustomTableEvents } from '$lib/components/DataTable'

  export let disabled: boolean

  const dispatch = createEventDispatcher<CustomTableEvents>()

  const onClick = () => dispatch('settingsVisibilityChanged')
</script>

<button
  data-name="settings-button"
  on:click={onClick}
  {disabled}
  id="Settings button {Math.random()}"
  aria-label="Settings button"
>
  <SvgIcon id="gear" />
</button>
