<script lang="ts">
  import iconsSvg from '../../styles/icons.svg?raw'
  import type { ISvgIconProps } from '../../interfaces/Types'

  let { id, width = '16px', height = '16px' }: ISvgIconProps = $props()

  let rendered = $state(false)
  let icon = $state<string | undefined>(undefined)

  async function init() {
    // Find the correct symbol with id X in the svg via a regex
    const regex = new RegExp(`<symbol([^>]*)id=["']${id}["']([^>]*)>([\\s\\S]*?)<\\/symbol>`, 'g')
    const match = iconsSvg.match(regex)?.at(0) ?? undefined
    if (!match) return
    // Replace the symbol tag with a svg tag and add the width & height
    icon = match.replace('<symbol', `<svg width="${width}" height="${height}"`)
    rendered = true
  }

  $effect(() => {
    init()
  })
</script>

{#if rendered && icon}
  {@html icon}
{/if}
