<script lang="ts">
	import { loadCSV, escape, toArrow } from 'arquero';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import type ISort from '$lib/interfaces/ISort';
	import { writable } from 'svelte/store';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IScheme from '$lib/interfaces/IScheme';

	// https://www.infoworld.com/article/3678168/filter-javascript-objects-the-easy-way-with-arquero.html
    // https://github.com/uwdata/arquero

	const filters = writable<Array<IFilter>>([]);
	const sorting = writable<Array<ISort>>([]);
	const pagination = writable<IPaginated>({
		currentPage: 1,
		totalPages: 1,
		rowsPerPage: 10
	});

	const columns = writable<Array<IScheme>>([]);
	const data = writable<any>([]);

	const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			const table = await await loadCSV('src/lib/data/usage-testdata.csv', { delimiter: ',' });

            // TODO: get this working better (it's not performant)
			for (let item of table._names) {
				$columns.push({
					type: 0,
					column: item
				});
			}
			for (let i = 0; i < table._total; i++) {
				const info = [];
				for (let item of table._names) {
					info.push(table._data[item].data[i]);
				}
				$data.push(info);
			}
			resolve({
				data: $data,
				scheme: $columns
			});
		});
	};
</script>

<DataTableRendererBasic {getData} {filters} {sorting} {pagination} />
