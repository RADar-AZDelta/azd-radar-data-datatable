<script lang="ts">
  import ExtraLayer from '@dtlib/components/datatable/extra/ExtraLayer.svelte'
  import type { ITableFootProps } from '@dtlib/interfaces/Types'

  let { paginationChanged, dt }: ITableFootProps = $props()
</script>

{#if !dt?.internalOptions?.hidePagination || !dt?.internalOptions?.hideOptions}
  <tfoot>
    <ExtraLayer {paginationChanged} {dt} />
  </tfoot>
{/if}
