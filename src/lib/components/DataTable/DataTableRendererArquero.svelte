<script lang="ts">
	import { loadCSV } from 'arquero';
	import { onDestroy, onMount } from 'svelte';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import type ISort from '$lib/interfaces/ISort';
	import { writable } from 'svelte/store';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IScheme from '$lib/interfaces/IScheme';

	// https://www.infoworld.com/article/3678168/filter-javascript-objects-the-easy-way-with-arquero.html
	// https://github.com/uwdata/arquero

	let worker: Worker | undefined = undefined;

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
			
			if (worker != undefined) resolve({ data: $data, scheme: $columns });
			else {
				return new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
					if (worker != undefined) {
						resolve({
							data: $data,
							scheme: $columns
						});
					} else {
						reject("Worker doens't want to load")
					}
				});
			}
		});
	};

	const onWorkerMessage = (data: any) => {
		$columns = data.data.data.columns;
		$data = data.data.data.data;
	};

	const loadWorker = async () => {
		const w = await import('$lib/workers/csv.worker?worker');
		worker = new w.default();
		// TODO: ask for data from worker (with filters, sorting , pagination, number of rows per page)
		const table = await await loadCSV('src/lib/data/usage-testdata.csv', { delimiter: ',' });
		worker.postMessage({ file: table });
		worker.onmessage = onWorkerMessage;
	};

	onMount(loadWorker);
	onDestroy(() => {
		if (worker) {
			worker.terminate();
		}
	});
</script>

<DataTableRendererBasic {getData} {filters} {sorting} {pagination} />
