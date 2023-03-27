<script lang="ts">
  import Types from '$lib/classes/enums/Types'
  import DataTableRendererSsr from '$lib/components/DataTable/DataTableRendererSSR.svelte'
  import type IFilter from '$lib/interfaces/IFilter'
  import type IPaginated from '$lib/interfaces/IPaginated'
  import type IScheme from '$lib/interfaces/IScheme'
  import type ISort from '$lib/interfaces/ISort'
  import { writable } from 'svelte/store'

  const url = writable<string>('https://jsonplaceholder.typicode.com/posts')
  const fetchOptions = {
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
    },
  }

  /*
		These properties are examples and can be changed to your data
	*/
  const pagination = writable<IPaginated>({
    currentPage: 1,
    totalPages: 3,
    rowsPerPage: 10,
    totalRows: 30,
  })
  const filters = writable<IFilter[]>([{ column: 'title', filter: 'auth' }])
  const sorting = writable<ISort[]>([{ column: 'id', direction: 1 }])

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
      let typeEnum = Types.string
      switch (type) {
        case 'string':
          typeEnum = Types.string
          break

        case 'number':
          typeEnum = Types.number
          break

        case 'boolean':
          typeEnum = Types.boolean
          break

        default:
          typeEnum = Types.regex
          break
      }
      scheme.push({
        column: key,
        type: typeEnum,
        editable: false,
        visible: true,
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
<DataTableRendererSsr {url} {fetchOptions} {transpileData} {pagination} {filters} {sorting} customCode={false} />
