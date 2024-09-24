import DataTable from '../helpers/datatable/DataTable.svelte'

let _dataTable = $state<DataTable>()

// Don't create the DataTable directly in the class (singleton) because it contains $effects.
// Because of this, the class initialisation needs to be done inside an effect.
// The effect with the initialisation will be done in the DataTable.svelte file and the datatable will be set here.
export function getDataTable() {
  const setDataTable = (dataTable: DataTable) => (_dataTable = dataTable)

  return {
    get dataTable() {
      return _dataTable
    },
    setDataTable,
  }
}
