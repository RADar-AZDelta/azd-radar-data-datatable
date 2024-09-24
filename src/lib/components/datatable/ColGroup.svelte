<script lang="ts">
  import columns from '../../helpers/columns/Columns.svelte'
  import options from '../../helpers/Options.svelte'
</script>

<colgroup>
  {#if options.internalOptions.actionColumn}
    <col data-name="col-action" width="0*" />
  {/if}
  {#each columns.visibleOrderedColumns as column, _}
    <col width={column.width ?? '0*'} />
  {/each}
</colgroup>
