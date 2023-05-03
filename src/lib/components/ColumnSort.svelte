<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import type { Hex, SortDirection, CustomTableEvents } from './DataTable.d.js'
  import SvgIcon from './SvgIcon.svelte'
  import { createEventDispatcher } from 'svelte'

  export let column: string,
    sortDirection: SortDirection,
    filledColor: Hex = '#626262',
    notFilledColor: Hex = '#FFFFFF',
    filledOpacity: number = 1,
    notFilledOpadcity: number = 0

  let upColor: Hex, downColor: Hex, upOpacity: number, downOpacity: number
  const dispatch = createEventDispatcher<CustomTableEvents>()

  $: switch (sortDirection) {
    case 'asc':
      upColor = filledColor
      downColor = notFilledColor
      upOpacity = filledOpacity
      downOpacity = notFilledOpadcity
      break
    case 'desc':
      upColor = notFilledColor
      downColor = filledColor
      upOpacity = notFilledOpadcity
      downOpacity = filledOpacity
      break
    default:
      upColor = filledColor
      downColor = filledColor
      upOpacity = filledOpacity
      downOpacity = filledOpacity
      break
  }

  function onClick() {
    switch (sortDirection) {
      case 'asc':
        sortDirection = 'desc'
        break
      case 'desc':
        sortDirection = undefined
        break
      default:
        sortDirection = 'asc'
        break
    }
    dispatch('columnSortChanged', { column, sortDirection })
  }
</script>

<button on:click={onClick}>
  <SvgIcon
    href="src/lib/static/icons.svg"
    id="updown"
    width="16px"
    height="16px"
    --up-color={upColor}
    --down-color={downColor}
    --up-opacity={upOpacity}
    --down-opacity={downOpacity}
  />
</button>
