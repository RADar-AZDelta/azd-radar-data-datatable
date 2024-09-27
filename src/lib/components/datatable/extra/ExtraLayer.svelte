<script lang="ts">
  import Settings from './Settings.svelte'
  import Pagination from '../../Pagination.svelte'
  import options from '../../../helpers/Options.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import type { IExtraLayer } from '../../../interfaces/Types'

  let { paginationChanged }: IExtraLayer = $props()

  // TODO: go further here
</script>

<tr class="row">
  <th colspan={columns.getTotalColumns()}>
    {#if options.internalOptions}
      <div class="container">
        {#if !options.internalOptions.hideOptions}
          <Settings />
        {/if}
        {#if !options.internalOptions.hidePagination}
          <Pagination {paginationChanged} />
        {/if}
      </div>
    {/if}
  </th>
</tr>

<style>
  .row {
    vertical-align: bottom;
    font-size: 1rem;
  }

  .container {
    display: flex;
  }
</style>
