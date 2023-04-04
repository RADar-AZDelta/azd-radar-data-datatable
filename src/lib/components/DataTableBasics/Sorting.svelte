<script lang="ts">
  import type { Nullable } from 'vitest'
  import SortDirection from '../../classes/enums/SortDirection'
  import SvgIcon from './SvgIcon.svelte'
  export let col: string, direction: number, updateSorting: Function

  type HEX = `#${string}`
  let upColor: HEX, downColor: HEX
  //let clazz: string

  $: switch (direction) {
    case SortDirection.Ascending:
      upColor = '#888888'
      downColor = '#ffffff'
      //clazz = 'asc'
      break
    case SortDirection.Descending:
      upColor = '#ffffff'
      downColor = '#888888'
      //clazz = 'desc'
      break
    default:
      upColor = '#888888'
      downColor = '#888888'
      //clazz = ''
      break
  }
</script>

<button class="button is-small is-fullwidth" on:click={updateSorting(col, direction)}>
  <p>{col}</p>
  <SvgIcon href="icons.svg" id="updown" width="1rem" height="1rem" --up-color={upColor} --down-color={downColor} />
  <!--SvgIcon href="icons.svg" id="updown" width="1rem" height="1rem" class="updown {clazz}" /-->
</button>

<style>
  /* :global(svg.updown.asc) {
    --up-color: #888888;
    --down-color: #ffffff;
  }

  :global(svg.updown.desc) {
    --up-color: #ffffff;
    --down-color: #888888;
  } */
</style>
