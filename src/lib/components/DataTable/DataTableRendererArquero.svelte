<script lang="ts">
	import { onMount } from 'svelte';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import type ISort from '$lib/interfaces/ISort';
	import { writable } from 'svelte/store';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IScheme from '$lib/interfaces/IScheme';
	import { workerMess } from '$lib/store'

	// https://www.infoworld.com/article/3678168/filter-javascript-objects-the-easy-way-with-arquero.html
	// https://github.com/uwdata/arquero

	let worker: Worker | undefined = undefined;

	const filters = writable<Array<IFilter>>([]);
	const sorting = writable<Array<ISort>>([]);
	const pagination = writable<IPaginated>({
		currentPage: 1,
		totalPages: 1,
		rowsPerPage: 10,
		totalRows: 10
	});

	const columns = writable<Array<IScheme>>([]);
	const data = writable<any>([]);

	const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			$workerMess = false
			resolve({
				scheme: $columns,
				data: $data
			});
		});
	};

	const hasData = (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			worker?.postMessage({
				filter: $filters,
				ordering: $sorting,
				pagination: $pagination
			})
			while($workerMess != true){
				await new Promise(resolve => setTimeout(resolve, 50));
			}
			resolve(await getData())
		});
	};

	const onWorkerMessage = async (data: any): Promise<void> => {
		$columns = data.data.processedData.columns;
		$data = data.data.processedData.data;
		$pagination = data.data.processedData.pagination;
		$workerMess = true
	};

	const loadWorker = async () => {
		const w = await import('$lib/workers/csv.worker?worker');
		worker = new w.default();
		worker.postMessage({
			filePath: '../data/medicatie_usagi.csv',
			filter: $filters,
			order: $sorting,
			pagination: $pagination
		});
		worker.onmessage = onWorkerMessage;
	};

	onMount(loadWorker);
</script>

<DataTableRendererBasic {hasData} {filters} {sorting} {pagination} />
