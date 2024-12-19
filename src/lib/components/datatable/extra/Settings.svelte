<script lang="ts">
  import SvgIcon from '@dtlib/components/general/SvgIcon.svelte'
  import Dialog from '@dtlib/components/general/Dialog.svelte'
  import type { IColumnMetaData, ISettingsProps } from '@dtlib/interfaces/Types'

  let { dt }: ISettingsProps = $props()

  let dialog = $state<HTMLDialogElement>()

  const showModal = (): void => dialog?.showModal()

  async function onColumnVisibilityChanged(e: Event): Promise<void> {
    if (!dt?.internalColumns || !dt?.internalColumns.length) return
    const { name, checked } = e.target as HTMLInputElement
    const column = dt?.internalColumns.find((col: IColumnMetaData) => col.id === name)
    if (!column) return
    column.visible = checked
  }
</script>

<button class="button" onclick={showModal} disabled={dt?.disabled ?? false} id="Settings button {Math.random()}" aria-label="Settings button">
  <SvgIcon id="gear" />
</button>

<Dialog bind:dialog height="60%" width="40%" title="Change column visibility">
  <div class="container">
    {#each ((dt?.internalColumns ?? []) as IColumnMetaData[]).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as column (column.id)}
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
