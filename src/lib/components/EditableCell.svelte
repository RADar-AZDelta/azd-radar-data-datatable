<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import SvgIcon from './SvgIcon.svelte'
  import { clickOutside } from '../actions/clickOutside.js'
  import { createEventDispatcher } from 'svelte'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'
  import { escapeWithKey } from '$lib/actions/escapeWithKey'
  import { saveWithKey } from '$lib/actions/saveWithKey'

  export let value: any
  let editValue: any
  $: {
    editValue = value
  }

  let editMode = false

  const dispatch = createEventDispatcher()

  function onClickSave() {
    editMode = false
    dispatch('valueChanged', editValue)
    value = editValue
  }

  function onClickCancel() {
    editValue = value
    editMode = false
  }
</script>

<div
  use:saveWithKey
  on:saveKey={onClickSave}
  use:clickOutside
  on:outclick={onClickCancel}
  use:escapeWithKey
  on:escapeKey={onClickCancel}
  data-name="cell"
>
  {#if !editMode}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <p on:click={() => (editMode = true)}>{value}</p>
  {:else}
    <textarea bind:value={editValue} />
    <button on:click={onClickSave}><SvgIcon href={iconsSvgUrl} id="checkmark" width="20px" height="20px" /></button>
  {/if}
</div>

<style>
  button {
    border: none;
    background-color: inherit;
  }
</style>
