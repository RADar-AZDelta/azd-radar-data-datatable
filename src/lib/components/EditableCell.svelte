<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import { saveWithKey } from '$lib/actions/saveWithKey'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { escapeWithKey } from '$lib/actions/escapeWithKey'

  export let value: any

  const dispatch = createEventDispatcher()

  $: editValue = value
  let editMode = false

  function onClickSave() {
    editMode = false
    value = editValue
    dispatch('valueChanged', editValue)
  }

  function onClickCancel() {
    editValue = value
    editMode = false
  }

  const enableEdit = () => (editMode = true)
</script>

<div
  use:saveWithKey
  on:saveKey={onClickSave}
  use:clickOutside
  on:outClick={onClickCancel}
  use:escapeWithKey
  on:escapeKey={onClickCancel}
  data-name="cell"
>
  {#if !editMode}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div on:click={enableEdit}>
      <p>{value}</p>
    </div>
  {:else}
    <textarea bind:value={editValue} />
    <button on:click={onClickSave}><SvgIcon id="checkmark" width="20px" height="20px" /></button>
  {/if}
</div>

<style>
  button {
    border: none;
    background-color: inherit;
  }

  div {
    width: 100%;
    height: 100%;
  }
</style>
