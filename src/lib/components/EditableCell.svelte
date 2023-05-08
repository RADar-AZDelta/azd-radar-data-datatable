<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import SvgIcon from './SvgIcon.svelte'
  import { createEventDispatcher } from 'svelte'
  import iconsSvgUrl from '$lib/styles/icons.svg?url'

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

<div on:mouseleave={onClickCancel} data-name="cell">
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
