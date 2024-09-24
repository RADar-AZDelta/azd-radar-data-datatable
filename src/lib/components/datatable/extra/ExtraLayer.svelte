<script lang="ts">
  import type { IExtraLayer } from '../../../interfaces/Types'
  import Pagination from '../../Pagination.svelte'
  import Settings from '../Settings.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import options from '../../../helpers/Options.svelte'
  import pagination from '../../../helpers/Pagination'

  let { paginationChanged }: IExtraLayer = $props()

  async function changePagination(rowsPerPage: number, currentPage: number) {
    await pagination.onPaginationChanged(rowsPerPage, currentPage, paginationChanged)
  }
</script>

<tr class="row">
  <th colspan={columns.getTotalColumns()}>
    {#if options.internalOptions}
      {@const { hideOptions, hidePagination, rowsPerPage, currentPage, rowsPerPageOptions, totalRows, paginationThroughArrowsOnly } = options.internalOptions}
      {@const { disabled } = options}
      <div class="container">
        {#if !hideOptions}
          <Settings {disabled} />
        {/if}
        {#if !hidePagination}
          <Pagination {rowsPerPage} {currentPage} {rowsPerPageOptions} totalRows={totalRows ?? 0} {disabled} {paginationThroughArrowsOnly} {changePagination} />
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
