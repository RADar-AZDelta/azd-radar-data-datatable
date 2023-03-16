<script lang="ts">
  import Types from '../../classes/enums/Types'
  import type IFilter from '$lib/interfaces/IFilter'
  import { writable } from 'svelte/store'
  import Filtering from '../DataTableBasics/Filtering.svelte'
  import Sorting from '../DataTableBasics/Sorting.svelte'
  export let updateSorting: Function, deleteFilter: Function, updateFiltering: Function

  let filters = writable<IFilter[]>()
</script>

<div data-component="tablerenderer">
  <table class="skeleton">
    <tr>
      {#each Array(5) as _, i}
        <th>
          <Sorting col={'Loading'} direction={0} {updateSorting} />
          <Filtering col={'Loading'} {deleteFilter} {updateFiltering} type={Types.string} bind:filters />
        </th>
      {/each}
    </tr>
    {#each Array(6) as _, i}
      <tr>
        {#each Array(5) as _, i}
          <td>
            <div class="skeleton" />
          </td>
        {/each}
      </tr>
    {/each}
  </table>
</div>
