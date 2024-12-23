<script lang="ts">
  import SvgIcon from '../components/general/SvgIcon.svelte'
  import type { IOptionsProps } from '../interfaces/Types'

  let { disabled, changeVisibility }: IOptionsProps = $props()
</script>

<button data-name="settings-button" onclick={changeVisibility} {disabled} id="Settings button {Math.random()}" aria-label="Settings button">
  <SvgIcon id="gear" />
</button>
