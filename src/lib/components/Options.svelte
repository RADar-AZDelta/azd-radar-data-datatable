<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'
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
  <SvgIcon href={iconsSvgUrl} id="gear" width="16px" height="16px" />
</button>
