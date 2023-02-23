<script lang="ts">
	import DataTableRenderer from '$lib/components/DataTableRenderer.svelte';
	import type ITable from '../lib/interfaces/ITable';
	import type { IFilter } from '../lib/interfaces/IFilter';
	import type IPaginated from '../lib/interfaces/IPaginated';
	import type { ITableData } from '../lib/interfaces/ITableData';
	import type { ISort } from '../lib/interfaces/ISort';
	import type { IScheme } from '$lib/interfaces/IScheme';
	import { sorting, pagination } from '$lib/store';
	import type ISorting from '$lib/interfaces/ISorting';
	import { writable } from 'svelte/store';
	import type { SortDirection } from '$lib/classes/enums/SortDirection';

	// TODO: place functionalities from +page.svelte to DataTableRenderer.svelte
	// TODO: make a basic DataTableRenderer.svelte because the one that is used right now is for data for that specific scheme.
	// TODO: not every column needs to be placed in the sorting store, only the ones that have been sorted
	// TODO: delete --> Delete all filters funtionality because it is an extra that can be implemented later
	// TODO: make extra tests for every component
	// TODO: experiment with a State Machine https://github.com/kenkunz/svelte-fsm

	const filters = writable<Array<IFilter>>([]);

	/*
        Get the column names out of the data
    */
	const getColumnsFromData = async (times: number) => {
		const columns: IScheme[] = [];
		for(let i = 0;i++;i<times){
			for (let info of data[i]) {
			let typeFound: number = 0;
			switch (typeof info[1]) {
				case 'string':
					typeFound = 0;
					break;

				case 'number':
					typeFound = 1;
					break;

				case 'boolean':
					typeFound = 2;
					break;
			}
			if (
				!columns.includes({
					column: info[0],
					type: typeFound
				})
			) {
				columns.push({
					column: info[0],
					type: typeFound
				});
			}
		}
		}
		return columns;
	};

	/*
        Get the filtered data without the column names in it
    */
	const filterData = async (
		columns?: string[],
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
		if (filters && columns) {
			const extraFilteredData: [string, any][][] = Array.from(new Set(filteredData)).filter(
				(elem) => elem != undefined
			);
			const columnsData = await getColumnsFromData(10);
			for (let filter of filters) {
				const colIndex = columnsData.findIndex(
					(obj) => obj.column == columns[filters.indexOf(filter)]
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

	/*
        Fill in the sorting store with the column names
    */

	const fillSortingStore = async (columns: IScheme[]) => {
		let localSt = [];
		for (let col of columns) {
			localSt.push({
				column: col.column,
				times: $sorting.length > 0 ? $sorting.filter((obj) => obj.column == col.column)[0].times : 0
			});
		}
		sorting.set(localSt);
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

	/*
        Update the pagination store with the number of pages
    */
	const updatePaginationStore = async (dataLength: number) => {
		pagination.set({
			currentPage: $pagination.currentPage,
			totalPages: Math.ceil(dataLength / $pagination.rowsPerPage),
			rowsPerPage: $pagination.rowsPerPage
		});
	};

	const updateSortingStore = async (value: ISort) => {
		sorting.update((sort): ISorting[] => {
			const sorting = sort;
			const index = sorting.findIndex((obj) => obj.column == value.column);
			sorting[index] = {
				column: value.column,
				times: sorting[index].times + 1
			};
			return sorting;
		});
		if (
			$sorting.filter((obj) => obj.column == value.column)[0].times > 2 ||
			$sorting.filter((obj) => obj.column == value.column)[0].times < 0
		)
			$sorting.filter((obj) => obj.column == value.column)[0].times = 0;
	};

	/*
        Some test data
    */
	export var columns: IScheme[];
	columns = [
		{
			column: "name",
			type: 0
		},
		{
			column: "age",
			type: 1 
		},
		{
			column: "country",
			type: 0
		},
		{
			column: "telephone",
			type: 0
		},
		{
			column: "address",
			type: 0
		}
	]

	export var data: [string, any][][];
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
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Cindy',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Derek',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Eve',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Frank',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Gina',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Hannah',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Ivan',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Jenny',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Karl',
			age: 35,
			country: 'USA',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		}),
		Object.entries({
			name: 'Rory2',
			age: 45,
			country: 'Belgium',
			telephone: '0800-123-524-634',
			address: '123 Main Street, New York, NY 10001'
		})
	];

	export var table: ITable = {
		setColumnFilter(value: IFilter): void {
			if ($filters.filter((obj) => obj.column == value.column).length != 0) {
				$filters.splice(
					$filters.indexOf($filters.filter((obj) => obj.column == value.column)[0]),
					1
				);
			}
			$filters.push({
				column: value.column,
				filter: value.filter
			});
		},
		setColumnSort(value: ISort): void {
			updateSortingStore(value);
		},
		setTablePagination(tablePagination: IPaginated): void {
			pagination.set(tablePagination);
		},
		deleteAllFilters(): void {
			$filters = [];
		},
		deleteFilter(column: string): void {
			$filters.splice($filters.indexOf($filters.filter((obj) => obj.column == column)[0]), 1);
		},
		getData(
			columnFilters?: IFilter[],
			columnSorts?: ISort[],
			tablePagination?: IPaginated
		): Promise<ITableData> {
			return new Promise(async (resolve, reject) => {
				let col
				// If there was no given scheme from the database or file, we'll guess the columns from looking at the data
				if(!columns) {
					col = await getColumnsFromData(10)
				}
				let filteredData = await filterData();
				fillSortingStore(columns);
				updatePaginationStore(filteredData.length);
				if ($filters.length > 0)
					filteredData = await filterData(
						$filters.map((obj) => obj.column),
						$filters.map((obj) => obj.filter)
					);
					// elements that not need to be sorted --> delete item out of store
				if ($sorting.length > 0) {
					for (let col of $sorting) {
						await sortData(col.column, col.times, filteredData, columns);
					}
				}
				return resolve({
					data: filteredData,
					scheme: columns
				});
			});
		}
	};
</script>

<h1>RADar-DataTable Demo - Simple Data</h1>
<p>
	This page demonstrates simple data, consisting of a matrix of key value pairs, also known as an
	array of `Object.entries(myObject)`.
</p>
<p />
<DataTableRenderer bind:table />
