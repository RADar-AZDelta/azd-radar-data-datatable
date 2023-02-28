<script lang="ts">
	import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import type IScheme from '$lib/interfaces/IScheme';
	import type ISort from '$lib/interfaces/ISort';
	import type ITableData from '$lib/interfaces/ITableData';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';
	import { workerMess } from '$lib/store';

	export let url: string,
		fetchOptions: object,
		transpileData: Function | undefined = undefined,
		dataType: string = 'CSV';

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

	/*
        This is the Arquero component where we fetch all of the data (CSV or JSON) and manipulate it with Arquero.
        With this version we need a webworker because we don't want to do the heavy lifting on our GUI thread (sorting, filtering, pagination).
        The user needs to give some params to this component like URL to know where to fetch the data, fetchOptions to know how to fetch.
        The last param is optional but recommended and this is a function the user creates to manipulate the data to the given format.
    */

	const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			$workerMess = false;
			resolve({
				scheme: $columns,
				data: $data
			});
		});
	};

	const hasData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			worker?.postMessage({
				filter: $filters,
				order: $sorting,
				pagination: $pagination
			});
			while ($workerMess != true) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
			resolve(await getData());
		});
	};

	const onWorkerMessage = async (data: any): Promise<void> => {
		$columns = data.data.processedData.columns;
		$data = data.data.processedData.data;
		$pagination = data.data.processedData.pagination;
		$workerMess = true;
	};

	const loadWorker = async () => {
		const w = await import('$lib/workers/csr.worker?worker');
		worker = new w.default();
		worker.postMessage({
			filePath: url,
			method: 'REST',
			fileType: dataType,
			fetchOptions: fetchOptions,
			filter: $filters,
			order: $sorting,
			pagination: $pagination
		});
		worker.onmessage = onWorkerMessage;
	};

	onMount(loadWorker);
</script>

<DataTableRendererBasic {hasData} {filters} {sorting} {pagination} />
