<script>
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
        <td class="spinner" rowspan="5" colspan="5"><Spinner big={true} /> <br />loading...</td>
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
  }
  th {
    min-width: 250px;
  }
  td {
    min-height: 500px;
    background-color: #fff;
  }
  .spinner {
    border: none;
    text-align: center;
    vertical-align: middle;
    height: 500px;
  }
</style>
