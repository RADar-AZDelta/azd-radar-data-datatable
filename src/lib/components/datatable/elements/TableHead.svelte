<script lang="ts">
  import ExtraLayer from '../extra/ExtraLayer.svelte'
  import TitleRow from './TitleRow.svelte'
  import FilterRow from './FilterRow.svelte'
  import type { ITableHeadProps } from '../../../interfaces/Types'

  let { paginationChanged, actionHeaderChild, dt }: ITableHeadProps = $props()
</script>

<thead>
  {#if dt?.internalOptions}
    {@const { paginationOnTop, hideOptions, hidePagination } = dt.internalOptions}
    {#if paginationOnTop && (!hideOptions || !hidePagination)}
      <ExtraLayer {paginationChanged} {dt} />
    {/if}
    <TitleRow {dt} />
    <FilterRow {actionHeaderChild} {dt} />
  {/if}
</thead>
