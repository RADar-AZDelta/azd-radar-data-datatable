<script lang="ts">
  import Spinner from './Spinner.svelte'
</script>

<div class="Skeleton">
  <table data-name="table-skeleton">
    <thead>
      <tr data-name="titles">
        <th>Header One</th>
        <th>Header Two</th>
        <th>Header Three</th>
        <th>Header Four</th>
        <th>Header Five</th>
      </tr>
      <tr data-name="filters" />
    </thead>
    <tbody>
      <tr>
        <td class="spinner"
          ><div>
            <Spinner big={true} /><br />
            <p>Loading...</p>
          </div></td
        >
      </tr>
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
    height: 400px;
  }
  .spinner {
    border: none;
    text-align: center;
    vertical-align: middle;
    position: relative;
    left: 500px;
  }
</style>
