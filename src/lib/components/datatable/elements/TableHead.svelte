<script lang="ts">
  import ExtraLayer from '../extra/ExtraLayer.svelte'
  import options from '../../../helpers/Options.svelte'
  import TitleRow from './TitleRow.svelte'
  import FilterRow from './FilterRow.svelte'
  import type { ITableHeadProps } from '../../../interfaces/Types'

  let { paginationChanged, actionHeaderChild }: ITableHeadProps = $props()
</script>

<thead>
  {#if options.internalOptions}
    {@const { paginationOnTop, hideOptions, hidePagination } = options.internalOptions}
    {#if paginationOnTop && (!hideOptions || !hidePagination)}
      <ExtraLayer {paginationChanged} />
    {/if}
    <TitleRow />
    <FilterRow {actionHeaderChild} />
  {/if}
</thead>
