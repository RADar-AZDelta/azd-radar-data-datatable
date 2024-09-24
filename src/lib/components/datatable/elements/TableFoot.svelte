<script lang="ts">
  import options from '../../../helpers/Options.svelte'
  import ExtraLayer from '../extra/ExtraLayer.svelte'
  import type { ITableFootProps } from '../../../interfaces/Types'

  let { paginationChanged }: ITableFootProps = $props()
</script>

{#if !options.internalOptions.hidePagination || !options.internalOptions.hideOptions}
  <tfoot>
    <ExtraLayer {paginationChanged} />
  </tfoot>
{/if}
