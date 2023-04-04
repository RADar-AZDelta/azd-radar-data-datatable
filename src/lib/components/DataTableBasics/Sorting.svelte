<script lang="ts">
  import SortDirection from '../../classes/enums/SortDirection'
  import SvgIcon from './SvgIcon.svelte'
  import { createEventDispatcher } from 'svelte'

  export let col: string, direction: number, updateSorting: Function

  type HEX = `#${string}`
  let upColor: HEX, downColor: HEX
  const dispatch = createEventDispatcher()

  $: switch (direction) {
    case SortDirection.Ascending:
      upColor = '#888888'
      downColor = '#ffffff'
      break
    case SortDirection.Descending:
      upColor = '#ffffff'
      downColor = '#888888'
      break
    case SortDirection.None:
      upColor = '#888888'
      downColor = '#888888'
      break
  }

  function onClick() {
    // switch (direction) {
    //   case SortDirection.Ascending:
    //     direction = SortDirection.Descending
    //     break
    //   case SortDirection.Descending:
    //     direction = SortDirection.None
    //     break
    //   case SortDirection.None:
    //     direction = SortDirection.Ascending
    //     break
    // }
    // if (direction == 2) direction = 0
    // else direction++
    dispatch('sortchanged', { col, direction })
  }
</script>

<button class="button is-small is-fullwidth" on:click={/*onClick*/ updateSorting(col, direction)}>
  <p>{col}</p>
  <SvgIcon href="icons.svg" id="updown" width="1rem" height="1rem" --up-color={upColor} --down-color={downColor} />
</button>

<style>
</style>
