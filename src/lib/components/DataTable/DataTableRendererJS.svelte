<script lang="ts">
	import type ISort from '$lib/interfaces/ISort';
	import type SortDirection from '$lib/classes/enums/SortDirection';
	import { writable } from 'svelte/store';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IScheme from '$lib/interfaces/IScheme';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import DataTableRendererBasic from '../DataTableBasics/DataTableRendererBasic.svelte';

	export let data: [string, any][][];
	export let columns: IScheme[];

	const filters = writable<Array<IFilter>>([]);
	const sorting = writable<Array<ISort>>([]);

	const pagination = writable<IPaginated>({
		currentPage: 1,
		totalPages: 1,
		rowsPerPage: 10
	});

	const filterData = async (
		filteredColumns?: string[],
		filters?: Array<string | number | RegExp | boolean | Date | undefined>
	) => {
		let filteredData: [string, any][][] = [];

		/*
            Filter column name out of data
        */
		for (let person of data) {
			let personInfo = [];
			for (let information of person) {
				personInfo.push(information[1]);
			}
			filteredData.push(personInfo);
		}

		/*
            Apply extra filters if given
        */
		if (filters && filteredColumns) {
			const extraFilteredData: [string, any][][] = Array.from(new Set(filteredData)).filter(
				(elem) => elem != undefined
			);
			for (let filter of filters) {
				const colIndex = columns.findIndex(
					(obj) => obj.column == filteredColumns[filters.indexOf(filter)]
				);
				switch (typeof filter) {
					case 'string':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (String(person[colIndex]).toLowerCase().includes(filter.toLowerCase()) != true) {
									delete extraFilteredData[extraFilteredData.indexOf(person)];
								}
							}
						}
						break;

					case 'number':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (Number(person[colIndex]) != filter) {
									delete extraFilteredData[extraFilteredData.indexOf(person)];
								}
							}
						}
						break;

					case 'boolean':
						for (let person of extraFilteredData) {
							if (person != undefined) {
								if (Boolean(person[colIndex]) != filter) {
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
		return filteredData;
	};

	const sortData = async (
		col: string,
		direction: SortDirection,
		data: [string, any][][],
		columns: IScheme[]
	) => {
		const colIndex = columns.findIndex((obj) => obj.column == col);
		let filteredData = data;
		switch (direction) {
			case 1:
				filteredData = data.sort(function (a, b) {
					if (b[colIndex] > a[colIndex]) return -1;
					if (b[colIndex] < a[colIndex]) return 1;
					return 0;
				});
				break;

			case 2:
				filteredData = data.sort(function (a, b) {
					if (b[colIndex] < a[colIndex]) return -1;
					if (b[colIndex] > a[colIndex]) return 1;
					return 0;
				});
				break;
		}
		return filteredData;
	};

    const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			let filteredData = await filterData();
			pagination.set({
				currentPage: $pagination.currentPage,
				totalPages: Math.ceil(filteredData.length / $pagination.rowsPerPage),
				rowsPerPage: $pagination.rowsPerPage
			});
			if ($filters.length > 0)
				filteredData = await filterData(
					$filters.map((obj) => obj.column),
					$filters.map((obj) => obj.filter)
				);
			pagination.set({
				currentPage: $pagination.currentPage,
				totalPages: Math.ceil(filteredData.length / $pagination.rowsPerPage),
				rowsPerPage: $pagination.rowsPerPage
			});
			if ($sorting.length > 0) {
				for (let col of $sorting) {
					await sortData(col.column, col.direction, filteredData, columns);
				}
			}
			return resolve({
				data: filteredData,
				scheme: columns
			});
		});
	};
</script>

<DataTableRendererBasic {getData} {filters} {sorting} {pagination}/>