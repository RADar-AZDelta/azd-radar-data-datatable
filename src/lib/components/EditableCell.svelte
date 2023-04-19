<!-- Copyright 2023 RADar-AZDelta -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'

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

<div on:mouseleave={onClickCancel}>
  {#if !editMode}
    <div on:click={() => (editMode = true)}>{value}</div>
  {:else}
    <input bind:value={editValue} />
    <button on:click={onClickSave}> Save </button>
  {/if}
</div>
