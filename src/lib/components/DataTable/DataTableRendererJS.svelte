<script lang="ts">
	import type ISort from '$lib/interfaces/ISort';
	import { writable } from 'svelte/store';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IScheme from '$lib/interfaces/IScheme';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';

	export let data: [string, any][][], columns: IScheme[];

	const columnsStore = writable<IScheme[]>(columns);
	const dataStore = writable<[string, any][][]>(data);
	const filters = writable<Array<IFilter>>([]);
	const sorting = writable<Array<ISort>>([]);
	const pagination = writable<IPaginated>({
		currentPage: 1,
		totalPages: 1,
		rowsPerPage: 10
	});

	const setColumnFilters = async (filters?: IFilter[]) => {
		let filteredData: [string, any][][] = [];
		/*
            Filter column name out of data
        */
		for (let person of data) {
			let personInfo: [string, any][] = [];
			for (let information of person) {
				personInfo.push(information[1]);
			}
			filteredData.push(personInfo);
		}

		/*
            Apply extra filters if given
        */
		if (filters) {
			const extraFilteredData: [string, any][][] = Array.from(new Set(filteredData)).filter(
				(elem) => elem != undefined
			);
			for (let filter of filters) {
				const colIndex = $columnsStore.findIndex(
					(obj) => obj.column == filters[filters.indexOf(filter)].column
				);
				switch (typeof filter.filter) {
					case 'string':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (
									String(person[colIndex]).toLowerCase().includes(filter.filter.toLowerCase()) !=
									true
								) {
									delete extraFilteredData[extraFilteredData.indexOf(person)];
								}
							}
						}
						break;

					case 'number':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (Number(person[colIndex]) != filter.filter) {
									delete extraFilteredData[extraFilteredData.indexOf(person)];
								}
							}
						}
						break;

					case 'boolean':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (Boolean(person[colIndex]) != filter.filter) {
									delete extraFilteredData[extraFilteredData.indexOf(person)];
								}
							}
						}
						break;

					default:
						if (filter instanceof RegExp) {
							for (let person of extraFilteredData) {
								if (person != undefined) {
									if (filter.test(String(person[colIndex])) == false) {
										delete extraFilteredData[extraFilteredData.indexOf(person)];
									}
								}
							}
						}
						break;
				}
			}

			filteredData = Array.from(new Set(extraFilteredData)).filter((elem) => elem != undefined);
		}
		$dataStore = filteredData;
	};

	const setColumnSort = async (sorting: ISort[]) => {
		let filteredData: [string, any][][] = $dataStore;

		for (let sort of sorting) {
			const colIndex = $columnsStore.findIndex((obj) => obj.column == sort.column);
			let data = filteredData;
			switch (sort.direction) {
				case 1:
					data = $dataStore.sort(function (a, b) {
						if (b[colIndex] > a[colIndex]) return -1;
						if (b[colIndex] < a[colIndex]) return 1;
						return 0;
					});
					break;

				case 2:
					data = $dataStore.sort(function (a, b) {
						if (b[colIndex] < a[colIndex]) return -1;
						if (b[colIndex] > a[colIndex]) return 1;
						return 0;
					});
					break;
			}
			filteredData = data;
		}
	};

	const setTablePagination = async (tablePagination: IPaginated) => {
		pagination.set({
			currentPage: tablePagination.currentPage,
			totalPages: Math.ceil($dataStore.length / tablePagination.rowsPerPage),
			rowsPerPage: tablePagination.rowsPerPage
		});
	};

	const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			await setColumnFilters();
			setTablePagination({
				currentPage: $pagination.currentPage,
				totalPages: Math.ceil($dataStore.length / $pagination.rowsPerPage),
				rowsPerPage: $pagination.rowsPerPage
			});
			if ($filters.length > 0) await setColumnFilters($filters);
			setTablePagination({
				currentPage: $pagination.currentPage,
				totalPages: Math.ceil($dataStore.length / $pagination.rowsPerPage),
				rowsPerPage: $pagination.rowsPerPage
			});
			if ($sorting.length > 0) {
				await setColumnSort($sorting);
			}
			resolve({
				data: $dataStore,
				scheme: $columnsStore
			});
		});
	};
	
	const hasData = async () => {
		return new Promise(async (resolve, reject) => {
			resolve(await getData())
		})
	}
</script>

<DataTableRendererBasic {hasData} {filters} {sorting} {pagination} />
