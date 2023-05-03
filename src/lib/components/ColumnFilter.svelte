<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import type { CustomTableEvents, TFilter } from './DataTable.d.js'
  import SvgIcon from './SvgIcon.svelte'
  import { createEventDispatcher } from 'svelte'
  import debounce from 'lodash.debounce'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'

  export let column: string, inputType: string, filter: TFilter

  let value: TFilter

  $: value = filter ? filter : ''

  const dispatch = createEventDispatcher<CustomTableEvents>()

  const onInput = debounce(e => {
    dispatch('columnFilterChanged', { column, filter: e.target.value })
  }, 500)

  function onClick() {
    dispatch('columnFilterChanged', { column, filter: undefined })
  }
</script>

<input on:input={onInput} type={inputType} {value} placeholder="Filter" />
<button on:click={onClick}>
  <SvgIcon href={iconsSvgUrl} id="x" width="16px" height="16px" />
</button>
