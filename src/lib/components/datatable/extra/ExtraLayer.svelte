<script lang="ts">
  import Settings from './Settings.svelte'
  import Pagination from '../../Pagination.svelte'
  import type { IExtraLayer } from '../../../interfaces/Types'

  let { paginationChanged, dt }: IExtraLayer = $props()
</script>

<tr class="row">
  <th colspan={dt?.getTotalColumns()}>
    {#if dt?.internalOptions}
      <div class="container">
        {#if !dt?.internalOptions.hideOptions}
          <Settings {dt} />
        {/if}
        {#if !dt?.internalOptions.hidePagination}
          <Pagination {paginationChanged} {dt} />
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
