<script lang="ts">
  import SvgIcon from '../../components/general/SvgIcon.svelte'
  import type { IDialogProps } from '../../interfaces/Types'

  let { dialog = $bindable(), width, height, title, children, buttonsChildren, close, canClose = true }: IDialogProps = $props()

  const outClick = () => {
    if (close) close()
    dialog?.close()
  }
</script>

<dialog class="dialog" bind:this={dialog} style="width: {width}; height: {height};">
  <div class="dialog-container">
    {#if canClose}
      <button class="close-dialog" onclick={outClick}><SvgIcon id="x" /></button>
    {/if}
    {#if title}
      <h3 class="title">{title}</h3>
    {/if}
    <div class="slot-container">
      {#if children}
        {@render children()}
      {/if}
    </div>
    <div class="buttons">
      {#if buttonsChildren}
        {@render buttonsChildren()}
      {/if}
    </div>
  </div>
</dialog>

<style>
  .dialog {
    border: none;
    border-radius: 10px;
    padding: 0;
    top: 0;
    left: 0;
    transform: none;
  }

  .dialog-container {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .close-dialog {
    position: absolute;
    right: 1rem;
    top: 1rem;
    border: none;
    background-color: inherit;
    color: black;
    cursor: pointer;
  }

  .title {
    padding: 0 1rem;
    margin-bottom: 0;
  }

  .slot-container {
    flex: 1 1 auto;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
</style>
