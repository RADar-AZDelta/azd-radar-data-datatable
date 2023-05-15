<script lang="ts">
  import Spinner from './Spinner.svelte'
  export let numberOfRows: number | undefined = 15
  export let columnWidth: Array<number> | undefined = [250, 250, 250, 250, 250]
  console.log('COLUMN WIDTH', columnWidth)
</script>

<div class="spinner"><Spinner big={true} /></div>
<div class="Skeleton">
  <table data-name="table-skeleton">
    <thead>
      <tr data-name="titles">
        {#if columnWidth}
          {#each columnWidth as width}
            <!--get width from datatable component to give the skeleton the same width-->
            <th style="{width ? `width: ${width}px` : ''};">Header</th>
          {/each}
        {/if}
        <!-- <th>Header One</th>
        <th>Header Two</th>
        <th>Header Three</th>
        <th>Header Four</th>
        <th>Header Five</th> -->
      </tr>
      <tr data-name="filters" />
    </thead>
    <tbody>
      {#if numberOfRows}
        {#each Array(numberOfRows) as _, i}
          <tr>
            <td /><td /><td /><td /><td />
          </tr>
        {/each}
      {/if}
    </tbody>
    <tfoot>
      <tr data-name="pagination" />
    </tfoot>
  </table>
</div>

<style>
  table {
    opacity: 60%;
    background-color: inherit;
    line-height: 20px;
    border-collapse: separate;
    border-spacing: 0px;
  }
  tr {
    display: table-row;
    height: 20px;
  }
  th {
    min-width: 250px;
    height: 60px;
  }
  td {
    background-color: #fff;
  }
  .spinner {
    border: none;
    text-align: center;
    vertical-align: middle;
    position: relative;
    z-index: 1;
    opacity: 40%;
    top: 75px;
    left: 550px;
    width: 0px;
    height: 0px;
  }
</style>
