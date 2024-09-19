<script lang="ts">
  import Dialog from '../general/Dialog.svelte'
  import SvgIcon from '../SvgIcon.svelte'
  import type { ISettingsProps } from '../../interfaces/Types'

  let { internalColumns = $bindable(), disabled }: ISettingsProps = $props()

  let dialog = $state<HTMLDialogElement>()

  const showModal = (): void => dialog?.showModal()

  async function onColumnVisibilityChanged(e: Event): Promise<void> {
    if (!internalColumns || !internalColumns.length) return
    const { name, checked } = e.target as HTMLInputElement
    const column = internalColumns.find(col => col.id === name)
    if (!column) return
    column.visible = checked
  }
</script>

<button class="button" onclick={showModal} {disabled} id="Settings button {Math.random()}" aria-label="Settings button">
  <SvgIcon id="gear" />
</button>

<Dialog bind:dialog height="60%" width="40%" title="Change column visibility">
  <div class="container">
    {#each (internalColumns ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as column}
      {@const { id, visible, label } = column}
      {@const checked = visible === undefined ? true : visible}
      <div class="option-container">
        <input type="checkbox" name={id} {id} {checked} onchange={onColumnVisibilityChanged} />
        <label for={id}>{label ?? id}</label><br />
      </div>
    {/each}
  </div>
</Dialog>

<style>
  .button {
    border: none;
    background-color: inherit;
  }

  .button:hover {
    background-color: #d3d3d3;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 2rem;
    height: 100%;
    overflow-y: auto;
  }

  .option-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  label {
    font-weight: normal;
  }
</style>
