<script lang="ts">
  import { onMount } from 'svelte'
  import icons from '$lib/styles/icons.svg?raw'

  /* 
    With the previous version of SvgIcon Vite would throw an error because of an unsafe attempt to load URL
    https://github.com/RADar-AZDelta/svelte-datatable/blob/594d38d6ecec09b516046172d2a45cecc0c55d7b/src/lib/components/SvgIcon.svelte

    In Sveltekit2, the implementation of Vite has changed.
    Previously (Sveltekit1) when importing an .svg file, it would just give you the url to the page & then you could use the following syntax:

    <svg class={$$props.class} {width} {height}>
      <use href={`${href}#${id}`} />
    </svg>

    With the use of the component like the following:

    import url from '$lib/styles/icons.svg?url'
    <SvgIcon href={url} id="x" width="16px" height="16px" />

    In Sveltekit2, this has changed because it won't retrieve the url anymore, but it will provide you with an already processed, data:image format.
    This throws the following error:

    Unsafe attempt to load URL data:image/svg+xml,...#ID from frame with URL. Domains, protocols and ports must match.

    This comes because the href in the use tag expects an url from the same domain & the protocol & port must match.
  
    This next approach isn't the best way to approach this (I strongly believe so), but at the moment I couldn't find a better way to implement a component to
    dynamically use svg icons from a seperate .svg file that is not in the static folder.

    If the .svg file is placed in the static folder, the previous version would work perfectly, but because this is a package, the icons
    in the static folder won't be given to the package. And even if it would be exported with the package, the path to the file would still be an issue.
  */

  export let width: string = '16px'
  export let height: string = '16px'
  export let id: string

  let rendered = false

  onMount(() => {
    // Take the raw svg document (string) & parse it to a seperate HTML document
    const parser = new DOMParser()
    const doc = parser.parseFromString(icons, 'image/svg+xml')
    const svgSelector = doc.querySelector('svg')
    if (!svgSelector) return
    // Create a new element with the parsed svg in
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = svgSelector.innerHTML
    document.body.appendChild(defs)
    rendered = true
  })
</script>

<svg {width} {height}>
  {#if rendered}
    <use href="#{id}" />
  {/if}
</svg>
