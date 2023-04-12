<script lang="ts">
  export let resizable: boolean | undefined
</script>

<div>
  <slot />
  {#if resizable}
    <div data-name="column-resize" />
  {/if}
</div>
