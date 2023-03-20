<script lang="ts">
  import type { Writable } from 'svelte/store'

  export let fileExtension: string,
    file: Writable<File | null>,
    text: string = 'Drop your file here'

  function dropHandler(event: DragEvent) {
    event.preventDefault()

    if (event.dataTransfer?.items) {
      if (event.dataTransfer.items.length > 1) {
        alert('Only drop one file')
      }
      for (let item of event.dataTransfer.items) {
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f?.name.toLowerCase().includes(fileExtension.toLowerCase())) {
            $file = f
          }
        }
      }
    }
  }

  function dragOverHandler(event: DragEvent) {
    event.preventDefault()
  }
</script>

<div class="container is-max-desktop">
  <div class={`${$file != null ? 'is-hidden' : 'box'}`}>
    <div class="img" data-component="drop" on:drop={dropHandler} on:dragover={dragOverHandler}>
      <p class="title">{text}</p>
      <img src="drag.png" alt="Drag icon" />
    </div>
  </div>
</div>

<style>
  .title {
    text-align: center;
  }
  .img {
    text-align: center;
  }
</style>
