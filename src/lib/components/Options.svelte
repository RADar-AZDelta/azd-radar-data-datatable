<script lang="ts">
  import SvgIcon from './SvgIcon.svelte'
  import type { CustomTableEvents } from './DataTable'
  import { createEventDispatcher } from 'svelte'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'

  export let disabled: boolean

  const dispatch = createEventDispatcher<CustomTableEvents>()

  function onClick() {
    dispatch('settingsVisibilityChanged')
  }
</script>

<button data-name="settings-button" on:click={onClick} {disabled}
  ><SvgIcon href={iconsSvgUrl} id="gear" width="16px" height="16px" /></button
>
