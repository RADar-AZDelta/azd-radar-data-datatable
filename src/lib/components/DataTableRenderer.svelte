<script lang="ts" ITable>
	import Sorting from './DataTable/Sorting.svelte';
	import Filtering from './DataTable/Filtering.svelte';
	import Pagination from './DataTable/Pagination.svelte';
	import type ISort from '$lib/interfaces/ISort';
	import type SortDirection from '$lib/classes/enums/SortDirection';
	import { writable } from 'svelte/store';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IScheme from '$lib/interfaces/IScheme';
	import type ITableData from '$lib/interfaces/ITableData';
	import type IPaginated from '$lib/interfaces/IPaginated';

	export let data: [string, any][][];
	export let columns: IScheme[];

	let update = 0;

	const filters = writable<Array<IFilter>>([]);
	const sorting = writable<Array<ISort>>([]);

	const pagination = writable<IPaginated>({
		currentPage: 1,
		totalPages: 1,
		rowsPerPage: 10
	});

	const updateTable = async () => {
		update += 1;
	};

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

	const updatePaginationStore = async (dataLength: number) => {
		pagination.set({
			currentPage: $pagination.currentPage,
			totalPages: Math.ceil(dataLength / $pagination.rowsPerPage),
			rowsPerPage: $pagination.rowsPerPage
		});
	};

	const updateSorting = async (col: string, direction?: SortDirection) => {
		/*
            Update the column sort
        */
		if (direction == 2) {
			sorting.update((sort): ISort[] => {
				const sorting = Array.from(new Set(sort.filter((obj) => obj.column != col)));
				return sorting;
			});
		}
		if ($sorting.filter((obj) => obj.column == col).length > 0) {
			sorting.update((sort): ISort[] => {
				const sorting = sort;
				const index = sorting.findIndex((obj) => obj.column == col);
				sorting[index] = {
					column: col,
					direction: sorting[index].direction + 1
				};
				return sorting;
			});
		} else {
			sorting.update((sort): ISort[] => {
				const sorting = sort;
				sorting.push({
					column: col,
					direction: 1
				});
				return sorting;
			});
		}
		if (
			$sorting.filter((obj) => obj.column == col)[0].direction > 2 ||
			$sorting.filter((obj) => obj.column == col)[0].direction < 0
		)
			sorting.update((sort): ISort[] => {
				const sorting = Array.from(new Set(sort.filter((obj) => obj.column != col)));
				return sorting;
			});
		updateTable();
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

	const changePage = async (page: number) => {
		/*
            Update the pagination
        */
		if (page > $pagination.totalPages) page--;
		if (page < 1) page = 1;
		pagination.set({
			currentPage: page,
			totalPages: $pagination.totalPages,
			rowsPerPage: $pagination.rowsPerPage
		});
		updateTable();
	};

	async function updateRowsPerPage(event: any) {
		/*
            Update the rows per page
        */
		pagination.set({
			currentPage: 1,
			totalPages: $pagination.totalPages,
			rowsPerPage: Number(event.target.value)
		});
		updateTable();
	}

	async function updateFiltering(event: any, type: any) {
		let filterValue = event.target.value;
		const filterColumn: string = event.target.placeholder.split(' ')[2];
		if (filterValue != undefined) {
			if (type == 1) {
				filterValue = Number(filterValue);
			} else if (type == 2) {
				filterValue = new RegExp(filterValue);
			}
		}

		if ($filters.filter((obj) => obj.column == filterColumn).length != 0) {
			$filters.splice($filters.indexOf($filters.filter((obj) => obj.column == filterColumn)[0]), 1);
		}
		$filters.push({
			column: filterColumn,
			filter: filterValue
		});
		updateTable();
	}

	const deleteFilter = async (column: string) => {
		$filters.splice($filters.indexOf($filters.filter((obj) => obj.column == column)[0]), 1);
		updateTable();
	};

	const getData = async (): Promise<ITableData> => {
		return new Promise(async (resolve, reject) => {
			let filteredData = await filterData();
			updatePaginationStore(filteredData.length);
			if ($filters.length > 0)
				filteredData = await filterData(
					$filters.map((obj) => obj.column),
					$filters.map((obj) => obj.filter)
				);
			// elements that not need to be sorted --> delete item out of store
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

<section>
	{#key update}
		{#await getData()}
			<p>Loading...</p>
		{:then data}
			<div class="table-comp">
				<h2 class="table-title">Information Table</h2>
				<table>
					<tr>
						{#each data.scheme as info}
							<th>
								<Sorting
									col={info.column}
									direction={$sorting.filter((obj) => obj.column == info.column)[0] != undefined
										? $sorting.filter((obj) => obj.column == info.column)[0].direction
										: 0}
									{updateSorting}
								/>
								<Filtering col={info.column} type={info.type} {deleteFilter} {updateFiltering} />
							</th>
						{/each}
					</tr>
					{#each Array(data.data.length - $pagination.rowsPerPage * $pagination.currentPage > 0 ? $pagination.rowsPerPage : $pagination.rowsPerPage - ($pagination.rowsPerPage * $pagination.currentPage - data.data.length)) as _, i}
						<tr class="row">
							{#each data.data[i + $pagination.rowsPerPage * ($pagination.currentPage - 1)] as row}
								<td>{row}</td>
							{/each}
						</tr>
					{/each}
				</table>
				<Pagination {updateRowsPerPage} {changePage} {data} pagination={$pagination} />
			</div>
		{/await}
	{/key}
</section>

<style>
	table {
		border-spacing: 0;
		width: 100%;
	}

	td {
		padding: 1rem;
	}

	th {
		width: max-content;
	}

	.table-comp {
		padding: 4rem 1rem 2rem;
	}

	.table-title {
		font-size: 2rem;
	}

	.row:nth-child(2n + 1) {
		background-color: inherit;
	}
	.row:nth-child(2n) {
		background-color: #e2e8f0;
	}
</style>
