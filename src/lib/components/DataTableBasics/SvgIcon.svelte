<script lang="ts">
  export let href: string
  export let id: string
  export let width: string
  export let height: string
</script>

<svg class={$$props.class} {width} {height}>
  <use href={`${href}#${id}`} />
</svg>
