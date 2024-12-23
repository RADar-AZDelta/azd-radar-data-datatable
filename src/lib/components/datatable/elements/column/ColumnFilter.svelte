<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { debounce } from '../../../../utils'
  import SvgIcon from '../../../../components/general/SvgIcon.svelte'
  import type { IColumnFilterProps } from '../../../../interfaces/Types.js'

  let { column, inputType, filter, dt }: IColumnFilterProps = $props()

  let value = $derived(filter ?? '')

  const onInput = debounce(e => dt.updateColumnFilter(column, e.target.value), 500)
  const onClick = () => dt.updateColumnFilter(column, '')
</script>

{#if column}
  {@const inputId = `Filter input ${column} ${Math.random()}`}
  {@const buttonId = `Cancel filter ${column} ${Math.random()}`}
  <div data-name="column-filter">
    <input id={inputId} oninput={onInput} type={inputType} {value} placeholder="Filter" disabled={dt.disabled} />
    <button onclick={onClick} disabled={dt.disabled} id={buttonId} aria-label="Cancel filter"><SvgIcon id="x" /></button>
  </div>
{/if}
