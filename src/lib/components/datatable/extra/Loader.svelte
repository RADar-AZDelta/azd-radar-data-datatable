<script lang="ts">
  import Spinner from '@dtlib/components/general/Spinner.svelte'
  import type { ILoaderProps } from '@dtlib/interfaces/Types'

  let { loadingChild, dt }: ILoaderProps = $props()
</script>

{#if loadingChild}
  {@render loadingChild()}
{:else}
  <tr data-name="loading" style="height: calc(var(--line-height) * {dt?.internalOptions?.rowsPerPage})">
    <td colspan={(dt?.visibleOrderedColumns?.length ?? 1) + (dt?.internalOptions?.actionColumn ? 1 : 0)}>
      <div data-name="info">
        <Spinner />
        <p>Loading...</p>
      </div>
    </td>
  </tr>
{/if}
