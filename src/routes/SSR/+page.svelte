<script lang="ts">
    import DataTableRendererSsr from '$lib/components/DataTable/DataTableRendererSSR.svelte'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'

  const url = 'https://jsonplaceholder.typicode.com/posts'
  const fetchOptions = {
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
    },
  }

  /*
		These properties are examples and can be changed to your data
	*/
  const pagination: IPaginated = {
    currentPage: 1,
    totalPages: 3,
    rowsPerPage: 10,
    totalRows: 30,
  }
  const filters: IFilter[] = [
    {
      column: 'title',
      filter: 'aut',
    },
  ]
  const sorting: ISort[] = [
    {
      column: 'id',
      direction: 1,
    },
  ]

  const transpileData = async (data: any) => {
    /*
			For REST matrix store
			Example:

			scheme: [
				{
					column: "a",
					type: 0 (0 = string, 1 = number, 2 = date, 3 = boolean),
				}
			]

			data: [
				["a1", "b1"],
				["a2", "b2"],
				["a3", "b3"]
			]

			Example 2:
			{
				"column1": ["a", "b", "c"],
				"column2": ["d", "e", "f"]
			}

			Here are the data and the scheme with the columns seperated
		*/
    const scheme: IScheme[] = []
    const dataFound: [string, any][][] = []
    for (let key in data[0]) {
      const type = typeof data[0][key]
      let typeEnum = 0
      switch (type) {
        case 'string':
          typeEnum = 0
          break

        case 'number':
          typeEnum = 1
          break

        case 'boolean':
          typeEnum = 2
          break

        default:
          typeEnum = 3
          break
      }
      scheme.push({
        column: key,
        type: typeEnum,
      })
    }
    for (let obj in data) {
      dataFound.push(Object.values(data[obj]))
    }
    const d = {
      scheme,
      data: dataFound,
    }

    return d
  }
</script>

<h1>RADar-DataTable Demo - REST data</h1>
<p>This page demonstrates how the already manipulated data gets fetched from the API and rendered in the DataTable.</p>
<DataTableRendererSsr {url} {fetchOptions} {transpileData} {pagination} {filters} {sorting} />
