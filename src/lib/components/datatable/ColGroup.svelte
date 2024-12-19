<script lang="ts">
  import type { IColGroupProps } from '@dtlib/interfaces/Types'

  let { dt }: IColGroupProps = $props()
</script>

<colgroup>
  {#if dt?.internalOptions?.actionColumn}
    <col data-name="col-action" width="0*" />
  {/if}
  {#each dt?.visibleOrderedColumns ?? [] as column, _}
    <col width={column.width ?? '0*'} />
  {/each}
</colgroup>
