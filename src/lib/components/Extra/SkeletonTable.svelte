<script lang="ts">
  import Filtering from '../DataTableBasics/Filtering.svelte'
  import Sorting from '../DataTableBasics/Sorting.svelte'
  export let updateSorting: Function, deleteFilter: Function, updateFiltering: Function
</script>

<div data-component="tablerenderer">
  <table class="skeleton">
    <tr>
      {#each Array(5) as _, i}
        <th>
          <Sorting col={'Loading'} direction={0} {updateSorting} />
          <Filtering
            col={'Loading'}
            {deleteFilter}
            {updateFiltering}
            type={0}
            filter={{ column: 'Loading', filter: '' }}
          />
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
