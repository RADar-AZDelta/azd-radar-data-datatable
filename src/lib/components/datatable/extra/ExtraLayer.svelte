<script lang="ts">
  import Settings from '@dtlib/components/datatable/extra/Settings.svelte'
  import Pagination from '@dtlib/components/Pagination.svelte'
  import type { IExtraLayer } from '@dtlib/interfaces/Types'

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
