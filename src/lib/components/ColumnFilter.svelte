<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import debounce from 'lodash.debounce'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import type { CustomTableEvents, TFilter } from './DataTable.d.js'

  export let column: string, inputType: string, filter: TFilter, disabled: boolean

  $: value = filter ?? ''

  const dispatch = createEventDispatcher<CustomTableEvents>()
  const onInput = debounce(e => dispatch('columnFilterChanged', { column, filter: e.target.value }), 500)
  const onClick = () => dispatch('columnFilterChanged', { column, filter: undefined })
</script>

<div data-name="column-filter">
  <input
    id="filter input {column} {Math.random()}"
    on:input={onInput}
    type={inputType}
    {value}
    placeholder="Filter"
    {disabled}
  />
  <button on:click={onClick} {disabled} id="Cancel filter {column} {Math.random()}" aria-label="Cancel filter">
    <SvgIcon id="x" />
  </button>
</div>
