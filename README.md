# RADar-DataTable

*A modular data table component for Svelte*

## Setup for development

Run these commands to get started:

```bash
git clone git@github.com:RADar-AZDelta/RADar-DataTable.git
cd RADar-DataTable
pnpm install
```

To run the example app, run `pnpm run dev --open` from the project root.

## Types

In the project there are the following types of the Data Table Renderer:
- DataTableRendererCSR
- DataTableRendererSSR
- DataTableRendererArquero
- DataTableRendererJS

### DataTableRendererCSR
The DataTableRendererCSR component gives you the ability to use a REST api to get data, use a local file or you can drag and drop your file with the DragAndDrop component (make sure these two components are placed on the same +page.svelte). If you want to use a local file you need to place the CSV file in the data folder in lib. When you give CSV content through the API call everything will work fine, but be cautious with JSON content becaus it needs to be a column-store format.
Example column-store format:
```json
{
    column1: ["a", "b", "c"],
    column2: ["d", "e", "f"]
}
```
The data that you get from the API call doesn't need to be manipulated. You can give all the data and the DataTableRendererCSR will map everything. When the data is mapped you can filter, sort or paginate through the data with the GUI.

The following properties are needed for the DataTableRendererCSR component to work.
Example 1 (REST):
```js
<script lang="ts">
const url: string = "https://jsonplaceholder.typicode.com/posts"

const fetchOptions: any = {
    method: 'GET',
    header: {
        'Content-Type': 'application/json' // For CSV its 'Content-Type': 'text/csv;charset=UTF-8'
    }
}

const dataType: string = "JSON" // Or "CSV"

const delimiter: string = "," // If not given to the component "," is assumed
</script>

<DataTableRendererCsr {url} {fetchOptions} {dataType} {delimiter}/>
```

Example 2 (Drag and Drop):
```js
<script lang="ts">
const file: writable<File | null>(null)

const fileExtension = 'CSV' // Or "JSON"

const delimiter = "," // If not given to the component "," is assumed
</script>

<DragAndDrop {file} {fileExtension} />
{#if file != null}
    <DataTableRendererCsr file={$file} dataType={fileExtension}/>
{/if}
```

Example 3 (local CSV file):
```js
<script lang="ts">
const fileName: string = "information.csv"

const dataType: string = "csv"

const delimiter: string = "," // If not given to the component "," is assumed
</script>

<DataTableRendererCsr {fileName} {delimiter} {dataType}/>
```

### DataTableRendererSSR
The DataTableRendererSSR component gives you the ability to use a REST api to get your data. The properties you need to give to the component are the following:
```js
<script lang="ts">
const url: string = "https://jsonplaceholder.typicode.com/posts"

const fetchOptions: any = {
    method: 'GET',
    header: {
        'Content-Type': 'application/json'
    }
}

const transpileData = async() => {
    //method to transpile the data from the API to a column-store
}

const pagination: IPaginated = {
    currentPage: 1,
    totalPages: 2,
    rowsPerPage: 10,
    totalRows: 30
}

const filters: IFilter[] = [
    {
        column: 'title',
        filter: 'aut'
    }
]

const sorting: ISort[] = [
    {
        column: 'id',
        direction: 2 // 0 = 'None', 1 = 'Ascending', 2 = 'Descending'
    }
]
</script>

<DataTableRendererSsr {url} {fetchOptions} {transpileData} {pagination} {filters} {sorting}/>
```
The DataTableRendererSSR expects already manipulated data (ex. already filtered). Only small portions of data are expected and if you want to put a lot of data in the mappingtool, use DataTableRendererCSR.
The expected format for the JSON files is a column-store. In this DataTableRenderer you can't make a transpileData method so it needs to be the correct format.

### DataTableRendererJS
This version of the DataTableRenderer uses simple JSON content for the data and for the columns.
Example:
```js
<script lang="ts">
export var columns: IScheme[]
columns = [
    {
        column: 'name',
        type: 0 // 0 = "string", 1 = "number", 2 = "boolean", 3 = "Date"
    },
    {
        column: 'city',
        type: 0
    }
]

export var data: [string, any][][]
data = [
    Object.entries({
        name: 'Rory',
        city: 'New York'
    }),
    Object.entries({
        name: 'Bob',
        city: 'Los Angeles'
    })
]
</script>

<DataTableRendererJs {data} {columns}/>
```