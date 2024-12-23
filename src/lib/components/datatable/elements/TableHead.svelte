<script lang="ts">
  import TitleRow from '../../../components/datatable/elements/TitleRow.svelte'
  import ExtraLayer from '../../../components/datatable/extra/ExtraLayer.svelte'
  import FilterRow from '../../../components/datatable/elements/FilterRow.svelte'
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
