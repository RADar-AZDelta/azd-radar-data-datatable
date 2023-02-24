<script lang="ts">
	import Sorting from './Sorting.svelte';
	import Filtering from './Filtering.svelte';
	import Pagination from './Pagination.svelte';
	import type ISort from '$lib/interfaces/ISort';
	import type SortDirection from '$lib/classes/enums/SortDirection';
	import type { Writable } from 'svelte/store';
	import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';

	export let getData: Function;
    export let filters: Writable<Array<IFilter>>
    export let sorting: Writable<Array<ISort>>
	export let pagination: Writable<IPaginated>

	let update = 0;

	const updateTable = async () => {
		/*
			Force an update of the table when sorting, filtering or pagination changes
		*/
		update += 1;
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
		changePage(1);
		updateTable();
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
		changePage(1);
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
