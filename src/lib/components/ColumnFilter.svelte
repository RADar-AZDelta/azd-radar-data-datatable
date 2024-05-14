<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { debounce } from '$lib/utils'
  import SvgIcon from '$lib/components/SvgIcon.svelte'
  import type { IColumnFilterProps } from '$lib/interfaces/Types.js'

  let { column, inputType, filter, disabled, updateColumnFilter }: IColumnFilterProps = $props()

  let value = $derived(filter ?? '')

  const onInput = debounce(e => updateColumnFilter(column, e.target.value), 500)
  const onClick = () => updateColumnFilter(column, undefined)
</script>

{#if column}
  {@const inputId = `Filter input ${column} ${Math.random()}`}
  {@const buttonId = `Cancel filter ${column} ${Math.random()}`}
  <div data-name="column-filter">
    <input id={inputId} oninput={onInput} type={inputType} {value} placeholder="Filter" {disabled} />
    <button onclick={onClick} {disabled} id={buttonId} aria-label="Cancel filter">
      <SvgIcon id="x" />
    </button>
  </div>
{/if}
