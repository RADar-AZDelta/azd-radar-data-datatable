<script lang="ts">
	import type ITable from '../interfaces/ITable';
	import { sorting, pagination } from '$lib/store';
	import { writable } from 'svelte/store';
	import Sorting from './DataTable/Sorting.svelte';
	import Filtering from './DataTable/Filtering.svelte';
	import Pagination from './DataTable/Pagination.svelte';

	export let table: ITable;

	let update = 0;

	const rows = writable<number>($pagination.rowsPerPage);

	const updateTable = async () => {
		update += 1;
	};

	const updateSorting = async (col: any, direction?: any) => {
		/*
            Update the column sort
        */
		table.setColumnSort({
			column: col,
			direction: $sorting.filter((obj) => obj.column == col)[0].times
		});
		updateTable();
	};

	const changePage = async (page: number) => {
		/*
            Update the pagination
        */
		if (page > $pagination.totalPages) page--;
		if (page < 1) page = 1;
		table.setTablePagination({
			currentPage: page,
			totalPages: $pagination.totalPages,
			rowsPerPage: $pagination.rowsPerPage
		});
		updateTable();
	};

	async function updateRowsPerPage (event: any) {
		/*
            Update the rows per page
        */
		table.setTablePagination({
			currentPage: $pagination.currentPage,
			totalPages: $pagination.totalPages,
			rowsPerPage: Number(event.target.value)
		});
		updateTable();
	};

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
		table.setColumnFilter({
			column: filterColumn,
			filter: filterValue
		});
		updateTable();
	}

	const deleteAllFiltering = async () => {
		table.deleteAllFilters();
		updateTable();
	};

	const deleteFilter = async (column: string) => {
		table.deleteFilter(column);
		updateTable();
	};
</script>

<section>
	{#key update}
		{#await table.getData()}
			<p>Loading...</p>
		{:then data}
			<div class="table-comp">
				<h2 class="table-title">Information Table</h2>
				<table>
					<tr>
						{#each data.scheme as info}
							<th>
								<Sorting col={info.column} direction={$sorting.filter(obj => obj.column == info.column)[0].times} {updateSorting}/>
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
				<Pagination {updateRowsPerPage} {changePage} {data} pagination={$pagination}/>
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
