# svelte-radar-datatable

Why yet another datatable component?
During the development of [Keun](https://github.com/RADar-AZDelta/Keun), we needed a datatable component that could handle CSV's with more than 100.000 rows.
We didn't find anything that suited our needs, so we developed our own.

## Features

- Supports multiple data sources: array of object, matrix of values, Function (remote data source) and File (CSV datasource)
- Sorting (multi column)
- Filtering (multi column)
- Fast for very large CSV files (more than 100.000 rows)
- Uses Arquero in a web worker for File (CSV) data source

## Usage (publishing the package to NPM needs to be done)

install the package

```bash
pnpm install svelte-radar-datatable
```

add the component to a svelte page

```svelte
<script lang="ts">
  import DataTable from 'svelte-radar-datatable'
  
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
    }
  ]
</script>

<DataTable {data} />
```

## Example

see [demo](https://radar-azdelta.github.io/svelte-radar-datatable/) site

## Manual

### Properties

The `DataTable` component accepts 3 properties: `options`, `columns`, and `data`.

```svelte
<DataTable {options} {columns} {data} />
```

#### Options property

#### Columns property

#### Data property

### Setup for development

Run these commands to get started:

```bash
git clone git@github.com:RADar-AZDelta/svelte-radar-datatable.git
cd svelte-radar-datatable
pnpm install
```

To run the example app, run `pnpm run dev --open` from the project root.

### TODO

- Adjustable column width
- Adjustable column order
