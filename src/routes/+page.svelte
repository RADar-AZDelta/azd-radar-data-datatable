<script lang="ts">
  import DataTableRendererJs from '$lib/components/DataTable/DataTableRendererJS.svelte'
  import type IScheme from '$lib/interfaces/IScheme'

  // TODO: set interface on components https://medium.com/geekculture/type-safe-mutual-exclusivity-in-svelte-component-props-3cc1cb871904
  // TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm
  // TODO: place long calculations in a computed property (make it understandable for others)

  /*
        Some test data
    */
  export var columns: IScheme[]
  columns = [
    {
      column: 'name',
      type: 0,
    },
    {
      column: 'age',
      type: 1,
    },
    {
      column: 'country',
      type: 0,
    },
    {
      column: 'telephone',
      type: 0,
    },
    {
      column: 'address',
      type: 0,
    },
  ]

  export var data: [string, any][][]

  data = [
    Object.entries({
      name: 'Rory',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Amethyst',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Bob',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Cindy',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Derek',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Eve',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Frank',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Gina',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Hannah',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Ivan',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Jenny',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Karl',
      age: 35,
      country: 'USA',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
    Object.entries({
      name: 'Rory2',
      age: 45,
      country: 'Belgium',
      telephone: '0800-123-524-634',
      address: '123 Main Street, New York, NY 10001',
    }),
  ]
</script>

<h1>RADar-DataTable Demo - Simple Data</h1>
<p>
  This page demonstrates simple data, consisting of a matrix of key value pairs, also known as an array of
  `Object.entries(myObject)`.
</p>
<DataTableRendererJs {data} {columns} />
