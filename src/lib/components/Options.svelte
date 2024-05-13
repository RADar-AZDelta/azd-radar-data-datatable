<script lang="ts">
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import type { IOptionsProps } from '$lib/interfaces/Types'

  let { disabled, changeVisibility }: IOptionsProps = $props()

  const onClick = () => changeVisibility()
</script>

<button data-name="settings-button" onclick={onClick} {disabled} id="Settings button {Math.random()}" aria-label="Settings button">
  <SvgIcon id="gear" />
</button>
