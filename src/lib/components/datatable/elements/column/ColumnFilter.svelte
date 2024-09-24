<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import { debounce } from '../../../../utils'
  import options from '../../../../helpers/Options.svelte'
  import SvgIcon from '../../../general/SvgIcon.svelte'
  import columns from '../../../../helpers/columns/Columns.svelte'
  import type { IColumnFilterProps } from '../../../../interfaces/Types.js'

  let { column, inputType, filter }: IColumnFilterProps = $props()

  let value = $derived(filter ?? '')

  const onInput = debounce(e => {
    columns.updateColumnFilter(column, e.target.value)
  }, 500)
  const onClick = () => columns.updateColumnFilter(column, '')
</script>

{#if column}
  {@const inputId = `Filter input ${column} ${Math.random()}`}
  {@const buttonId = `Cancel filter ${column} ${Math.random()}`}
  <div data-name="column-filter">
    <input id={inputId} oninput={onInput} type={inputType} {value} placeholder="Filter" disabled={options.disabled} />
    <button onclick={onClick} disabled={options.disabled} id={buttonId} aria-label="Cancel filter"><SvgIcon id="x" /></button>
  </div>
{/if}
