<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import SvgIcon from './SvgIcon.svelte'
  import type { Hex, SortDirection, CustomTableEvents } from './DataTable.d.js'

  export let column: string,
    sortDirection: SortDirection,
    disabled: boolean,
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
    sortDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? undefined : 'asc'
    dispatch('columnSortChanged', { column, sortDirection })
  }
</script>

<button id="sort-{column}-{Math.random()}" on:click={onClick} {disabled} aria-label="Sorting">
  <SvgIcon id="updown" --up-color={upColor} --down-color={downColor} --up-opacity={upOpacity} --down-opacity={downOpacity} />
</button>
