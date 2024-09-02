<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import SvgIcon from '../components/SvgIcon.svelte'
  import { saveWithKey } from '../actions/saveWithKey'
  import { clickOutside } from '../actions/clickOutside'
  import { escapeWithKey } from '../actions/escapeWithKey'
  import type { IEditableCellProps } from '../interfaces/Types'

  let { value, changeValue }: IEditableCellProps = $props()

  let editValue = $state('')
  let editMode = $state(false)

  function onClickSave() {
    editMode = false
    value = editValue
    console.log('NEW VALUE ', value)
    changeValue(value)
  }

  function onClickCancel() {
    editValue = value
    editMode = false
  }

  const enableEdit = () => (editMode = true)

  const setEditValue = (value: any) => (editValue = value)

  $effect(() => {
    setEditValue(value)
  })
</script>

<div use:saveWithKey onsaveKey={onClickSave} use:clickOutside onoutClick={onClickCancel} use:escapeWithKey onescapeKey={onClickCancel} data-name="cell">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  {#if !editMode}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div onclick={enableEdit} class="cell-container">
      <p>{value}</p>
    </div>
  {:else}
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <textarea bind:value={editValue} />
    <button onclick={onClickSave}><SvgIcon id="checkmark" width="20px" height="20px" /></button>
  {/if}
</div>

<style>
  button {
    border: none;
    background-color: inherit;
  }

  div {
    width: 100%;
    min-height: 1rem;
    height: 100%;
  }
</style>
