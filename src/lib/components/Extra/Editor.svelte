<script lang="ts">
  import type { Writable } from 'svelte/store'

  export let col: number,
    row: number,
    updateData: Function | undefined = undefined,
    updated: Writable<boolean>,
    editClick: Writable<boolean>,
    editorUpdating: Writable<boolean>,
    ownEditorVisuals: any | undefined = undefined,
    ownEditorMethods: Function | undefined = undefined,
    worker: Worker | undefined = undefined

  let eventListener: string
  let updatedParent: string[] = []
  let parent: any

  const editor = async (id: string) => {
    parent = document.getElementById(id)
    if (eventListener != id && $editorUpdating == false) {
      // First press on edit button
      eventListener = id
      let value: string
      if (parent.firstChild.data == undefined) value = parent.firstChild.innerText
      else value = parent.firstChild.data
      // Remove <p> tag and replace with <input> tag with the previous value of the <p> tag in it
      parent?.firstChild.remove()
      const input = document.createElement('input')
      input.value = value
      parent?.appendChild(input)
      editorUpdating.set(true)
      if (updatedParent.filter(obj => obj == id).length == 0) {
        updatedParent.push(id)
        parent.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter') {
            editor(id)
          }
        })
      }
    } else if (eventListener == id && $editorUpdating == true) {
      // When in editing state and "Enter" key is pressed or the edit button is pressed
      // @ts-ignore
      const value = document.getElementById(id)?.firstChild?.value
      parent?.firstChild.remove()
      const tag = document.createElement('p')
      tag.appendChild(document.createTextNode(value))
      parent?.appendChild(tag)
      if (updateData != undefined) {
        updated.set(true)
        updateData(worker, id, value)
      }

      editorUpdating.set(false)
      eventListener = ''
    }
  }
</script>

{#if ownEditorVisuals != undefined}
  {ownEditorVisuals}
{:else}
  <button
    data-component="editor"
    on:click={function () {
      editClick.set(true)
      if (ownEditorMethods == undefined) {
        editor(`${row}-${col}`)
      }
    }}
    class="button is-small"><img class="image is-16x16" src="/edit.svg" alt="Edit the cell" /></button>
{/if}

<style>
  .button {
    width: 40px;
    border: none;
    background: none;
    padding-right: 5px;
    padding-left: 5px;
  }
</style>
