<script lang="ts">
  import Spinner from '../../Spinner.svelte'
  import options from '../../../helpers/Options.svelte'
  import columns from '../../../helpers/columns/Columns.svelte'
  import type { ILoaderProps } from '../../../interfaces/Types'

  let { loadingChild }: ILoaderProps = $props()
</script>

{#if loadingChild}
  {@render loadingChild()}
{:else}
  <tr data-name="loading" style="height: calc(var(--line-height) * {options.internalOptions.rowsPerPage})">
    <td colspan={(columns.visibleOrderedColumns?.length ?? 1) + (options.internalOptions.actionColumn ? 1 : 0)}>
      <div data-name="info">
        <Spinner />
        <p>Loading...</p>
      </div>
    </td>
  </tr>
{/if}
