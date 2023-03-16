<script lang="ts">
  import type { Writable } from 'svelte/store'

  export let col: number,
    row: number,
    updateData: Function | null = null,
    updated: Writable<boolean>,
    editClick: Writable<boolean>,
    editorUpdating: Writable<boolean>,
    ownEditorVisuals: any | undefined = undefined,
    ownEditorMethods: Function | undefined = undefined

  let eventListener: string
  let updatedParent: string[] = []
  let parent: any
  //   let editClick = writable<boolean>(false)

  const editor = async (event: string) => {
    parent = document.getElementById(event)
    if (eventListener != event && $editorUpdating == false) {
      // First press on edit button
      eventListener = event
      let value: string
      if (parent.firstChild.data == undefined) value = parent.firstChild.innerText
      else value = parent.firstChild.data
      // Remove <p> tag and replace with <input> tag with the previous value of the <p> tag in it
      parent?.firstChild.remove()
      const input = document.createElement('input')
      input.value = value
      parent?.appendChild(input)
      editorUpdating.set(true)
      if (updatedParent.filter(obj => obj == event).length == 0) {
        updatedParent.push(event)
        parent.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter') {
            editor(event)
          }
        })
      }
    } else if (eventListener == event && $editorUpdating == true) {
      // When in editing state and "Enter" key is pressed or the edit button is pressed
      // @ts-ignore
      const value = document.getElementById(event)?.firstChild?.value
      parent?.firstChild.remove()
      const tag = document.createElement('p')
      tag.appendChild(document.createTextNode(value))
      parent?.appendChild(tag)
      if (updateData != null) {
        updated.set(true)
        updateData(event, value)
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
    class="button-edit"><img src="/edit.svg" alt="Edit the cell" /></button
  >
{/if}
