<script lang="ts">
  import type { CustomTableEvents, TFilter } from './DataTable.d.js'
  import SvgIcon from './SvgIcon.svelte'
  import { createEventDispatcher } from 'svelte'
  import debounce from 'lodash.debounce'

  export let column: string, inputType: string, filter: TFilter

  let value: TFilter

  $: value = filter ? filter : ''

  const dispatch = createEventDispatcher<CustomTableEvents>()

  const onInput = debounce(e => {
    dispatch('columnFilterChanged', { column, filter: e.target.value })
  }, 500)

  function onClick() {
    dispatch('columnFilterChanged', { column, filter: undefined })
  }
</script>

<input on:input={onInput} type={inputType} {value} placeholder="Filter" />
<button on:click={onClick}>
  <SvgIcon href="icons.svg" id="x" width="1rem" height="1rem" />
</button>
