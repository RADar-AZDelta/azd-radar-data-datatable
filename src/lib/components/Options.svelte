<script lang="ts">
  import SvgIcon from './general/SvgIcon.svelte'
  import type { IOptionsProps } from '../interfaces/Types'

  let { disabled, changeVisibility }: IOptionsProps = $props()

  const onClick = () => changeVisibility()
</script>

<button data-name="settings-button" onclick={onClick} {disabled} id="Settings button {Math.random()}" aria-label="Settings button">
  <SvgIcon id="gear" />
</button>
