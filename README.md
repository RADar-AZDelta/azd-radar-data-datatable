# @radar-azdelta/svelte-datatable

Why yet another datatable component?
During the development of [Keun](https://github.com/RADar-AZDelta/Keun), we needed a datatable component that could handle CSV's with more than 100.000 rows.
We didn't find anything that suited our needs, so we developed our own.

## Features

- Supports multiple data sources: array of object, matrix of values, Function (remote data source) and File (CSV datasource)
- Sorting (multi column)
- Filtering (multi column)
- Reposition columns
- Resize columns
- Store column settings in localStorage
- Show/hide columns
- Fast for very large CSV files (more than 100.000 rows)
- Uses [Arquero](https://uwdata.github.io/arquero/) in a web worker for File (CSV) data source

## Usage

install the package

```bash
pnpm install @radar-azdelta/svelte-datatable
```

add the component to a svelte page

```svelte
<script lang="ts">
  import DataTable from '@radar-azdelta/svelte-datatable'

  const data = [
    {
      name: 'Rory',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Rue des Taillis 221,Gijzelbrechtegem,West Flanders,8570,',
    },
    {
      name: 'Amethyst',
      age: 35,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: 'Eikstraat 450,Belgrade,Namur,5001,',
    },
  ]
</script>

<DataTable {data} />
```

Also add the folowing config to your vite.config.ts, otherwise @radar-azdelta/svelte-datatable worker can't be downloaded.

```js
export default defineConfig({
  ...
  optimizeDeps: {
    exclude: ['@radar-azdelta/svelte-datatable'],
  }
  ...
})
```

## Example

see [demo](https://radar-azdelta.github.io/svelte-datatable/) site

## Manual

### Properties

The `DataTable` component accepts 3 properties: `options`, `columns`, and `data`.

```svelte
<DataTable {options} {columns} {data} />
```

#### Options property

global options for the DataTable

```typescript
interface ITableOptions {
  id?: string
  currentPage?: number
  rowsPerPage?: number
  rowsPerPageOptions?: number[]
  actionColumn?: boolean
}
```

| Value                  | Description                                                                                                                                                              | Required | Default              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------- |
| **id**                 | identifier for the datatable, so that it settings can be stored in localStorage                                                                                          | no       |                      |
| **currentPage**        | the current page to display                                                                                                                                              | no       | 1                    |
| **rowsPerPage**        | number of rows visible in a page                                                                                                                                         | no       | 20                   |
| **rowsPerPageOptions** | number of rows visible in a page                                                                                                                                         | no       | [5, 10, 20, 50, 100] |
| **actionColumn**       | Adds an action column as first column. This can be used to add aditional functionality, for example 'selecting multiple columns', or 'add custom action buttoms', etc... | no       | false                |

#### Columns property

The columns can be extracted from the data property (except when the data is a matrix). But you can also manually define the columns.

```typescript
interface IColumnMetaData {
  id: string
  label?: string
  visible?: boolean
  sortable?: boolean
  filterable?: boolean
  resizable?: boolean
  repositionable?: boolean
  sortDirection?: SortDirection
  sortOrder?: number
  filter?: any
  position?: number
  width?: number
}
```

| Value              | Description                                                                 | Required | Default |
| ------------------ | --------------------------------------------------------------------------- | -------- | ------- |
| **id**             | id or name of the column                                                    | yes      |         |
| **label**          | id or name of the column                                                    | no       |         |
| **visible**        | is the column visible                                                       | no       | yes     |
| **sortable**       | is the column sortable                                                      | no       | yes     |
| **filterable**     | is the column filterable                                                    | no       | yes     |
| **resizable**      | FUTURE FUNCTIONALITY: can the column width be adjusted                      | no       | yes     |
| **repositionable** | can the column be repositioned                                              | no       | yes     |
| **sortDirection**  | do not sort (undefined), sort the column 'asc' or 'desc'                    | no       |         |
| **sortOrder**      | if multiple columns are sorted, this prop defines the sequence of the order | no       |         |
| **filter**         | filter the column values                                                    | no       |         |
| **position**       | the visual position (sequence) of the column                                | no       |         |
| **width**          | FUTURE FUNCTIONALITY: the width of the column                               | no       |         |

#### Data property

- Array of Objects

```typescript
const data = [
  {
    name: 'Rory',
    age: 35,
    country: 'Belgium',
    telephone: '0800-123-524-634',
    address: 'Rue des Taillis 221,Gijzelbrechtegem,West Flanders,8570,',
  },
  {
    name: 'Amethyst',
    age: 35,
    country: 'Belgium',
    telephone: '0800-123-524-634',
    address: 'Eikstraat 450,Belgrade,Namur,5001,',
  },
]
```

- Matrix (requires the columns property)

```typescript
const data = [
  ['Rory', 35, 'Belgium', '0800-123-524-634', 'Rue des Taillis 221,Gijzelbrechtegem,West Flanders,8570,'],
  ['Amethyst', 35, 'Belgium', '0800-123-524-634', 'Eikstraat 450,Belgrade,Namur,5001,'],
]
```

- Function (fetch from webservice)

```typescript
async function fetchData(
  filteredColumns: Map<string, TFilter>,
  sortedColumns: Map<string, SortDirection>,
  pagination: IPagination
): Promise<{ totalRows: number; data: any[][] | any[] }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filteredColumns: [...filteredColumns], sortedColumns: [...sortedColumns], pagination }),
  })
  const result = response.json()
  return { totalRows: result.totalRows, data: result.data }
}
```

- File (CSV)

```typescript
const response = await fetch(
  'https://raw.githubusercontent.com/RADar-AZDelta/AZDelta-OMOP-CDM/main/drug_exposure/drug_concept_id/medicatie_usagi.csv'
)
const blob = await response.blob()
const metadata = {
  type: 'text/csv',
}
const data = new File([data], 'medicatie_usagi.csv', metadata)
```

### Setup for development

Run these commands to get started:

```bash
git clone git@github.com:RADar-AZDelta/svelte-datatable.git
cd svelte-datatable
pnpm install
```

To run the example app, run `pnpm run dev --open` from the project root.

### Reorder Column

![reorderColumn](https://github.com/RADar-AZDelta/svelte-datatable/assets/71766353/897b813e-76f7-4739-b815-30fb4dc1857f)

### Resize Column

![ResizeColumn](https://github.com/RADar-AZDelta/svelte-datatable/assets/71766353/4d84eae1-dbe3-4c39-b02b-2d7097ce7685)

### Visible Columns

![VisibleColumns](https://github.com/RADar-AZDelta/svelte-datatable/assets/71766353/ef02fdfb-d8d0-453e-b28b-9e1195914bfb)

### Edit cell

Als EditableCell is toegevoegd in het Datatable component dan kan u doubel klikken op de tekst om die aan te passen.  
escape key kan gebruikt worden om uit de input te gaan zonder aanpassing op te slaan.  
enter key kan gebruikt worden of check button om de aanpassing op te slaan.

![EditCell](https://github.com/RADar-AZDelta/svelte-datatable/assets/71766353/55ffe46d-718e-41b3-b05d-56763829e99c)
