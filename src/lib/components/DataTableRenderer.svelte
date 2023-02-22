<script lang="ts">
	import type ITable from '../interfaces/ITable';
	import { sorting, pagination } from '$lib/store';
	import { writable } from 'svelte/store';

	export let table: ITable;

	let update = 0;

	const rows = writable<number>($pagination.rowsPerPage);

	const updateTable = async () => {
		update += 1;
	};

	const updateSorting = async (col: string) => {
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

	const updateRowsPerPage = async () => {
		/*
            Update the rows per page
        */

		table.setTablePagination({
			currentPage: $pagination.currentPage,
			totalPages: $pagination.totalPages,
			rowsPerPage: Number($rows)
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
			<table>
				<tr>
					{#each data.scheme as info}
						<th>
							<div class="table-header-element">
								<button
									on:click={() => {
										updateSorting(info.column);
									}}
									class="table-head"
								>
									<p class="column-name">{info.column}</p>
									{#if $sorting.filter((obj) => obj.column == info.column)[0].times == 0}
										<img src="/no-filter.svg" alt="No filter icon" />
									{:else if $sorting.filter((obj) => obj.column == info.column)[0].times == 1}
										<img src="/ascending-filter.svg" alt="Ascending filter icon" />
									{:else if $sorting.filter((obj) => obj.column == info.column)[0].times == 2}
										<img src="/descending-filter.svg" alt="Descending filter icon" />
									{:else}
										<p>Something went wrong!</p>
									{/if}
								</button>
								<button on:click={() => deleteFilter(info.column)} class="filter-deletion">
									<p>Filter</p>
									<img src="/x.svg" alt="Cross icon" />
								</button>
							</div>
							<input
								on:change={() => updateFiltering(event, info.type)}
								class="input-filtering"
								type={info.type == 0 ? 'text' : info.type == 1 ? 'number' : 'checkbox'}
								placeholder="filter by {info.column}"
							/>
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
			<section class="table-information">
				<div class="table-rows">
					<p>Rows:</p>
					<select
						bind:value={$rows}
						class="table-rows-select"
						id="rows"
						on:change={() => updateRowsPerPage()}
					>
						<option value="10">10</option>
						<option value="20">20</option>
						<option value="50">50</option>
						<option value="100">100</option>
					</select>
					<p>
						{$pagination.rowsPerPage * $pagination.currentPage + 1 - $pagination.rowsPerPage}-{data
							.data.length -
							$pagination.rowsPerPage * $pagination.currentPage >
						0
							? $pagination.rowsPerPage
							: $pagination.rowsPerPage -
							  ($pagination.rowsPerPage * $pagination.currentPage - data.data.length) +
							  $pagination.rowsPerPage * ($pagination.currentPage - 1)} of {data.data.length}
					</p>
				</div>
				<button class="button-filters" on:click={deleteAllFiltering}>
					<p>Delete filters</p>
					<img src="/x.svg" alt="Cross icon" />
				</button>
				<div class="pagination">
					<button
						on:click={() => changePage($pagination.currentPage - 1)}
						class={`arrow-button ${$pagination.currentPage == 1 ? 'arrow-button-disable' : null}`}
						><img src="/arrow-left.svg" alt="Arrow left" /></button
					>
					{#each Array($pagination.totalPages) as _, i}
						<button
							on:click={() => {
								changePage(i + 1);
							}}
							class="pagination-page"
						>
							<p class={`${i + 1 == $pagination.currentPage ? 'pagination-page-selected' : null}`}>
								{i + 1}
							</p>
						</button>
					{/each}
					<button
						on:click={() => changePage($pagination.currentPage + 1)}
						class={`arrow-button ${
							$pagination.currentPage == $pagination.totalPages ? 'arrow-button-disable' : null
						}`}><img src="/arrow-right.svg" alt="Arrow right" /></button
					>
				</div>
			</section>
		{/await}
	{/key}
</section>

<style>
	table {
		border-spacing: 0;
		width: 100%;
		padding: 4rem 1rem 2rem;
	}

	td {
		padding: 1rem;
	}

	th {
		width: max-content;
	}

	.button-filters {
		padding: 1rem;
		display: flex;
		align-items: center;
		background-color: lightcoral;
		border: none;
		border-radius: 5px;
		gap: 0.5rem;
		cursor: pointer;
	}

	.table-head {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.5rem 0;
		gap: 0.5rem;
		border: none;
		background-color: inherit;
		cursor: pointer;
	}

	.table-head:hover {
		background-color: #e2e8f0;
	}

	.table-header-element {
		width: 80%;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.column-name {
		font-weight: 800;
		font-size: 1rem;
	}

	.row:nth-child(2n + 1) {
		background-color: inherit;
	}
	.row:nth-child(2n) {
		background-color: #e2e8f0;
	}

	.table-information {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.table-rows {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.table-rows-select {
		padding: 1rem;
		width: 8rem;
		border-radius: 5px;
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.pagination-page {
		border: none;
		background-color: inherit;
		cursor: pointer;
	}

	.pagination-page:hover {
		font-weight: 800;
	}

	.pagination-page-selected {
		font-weight: 800;
	}

	.arrow-button {
		background-color: inherit;
		border: none;
		cursor: pointer;
	}

	.arrow-button-disable {
		cursor: auto;
	}

	.input-filtering {
		width: 80%;
		display: flex;
		align-self: flex-start;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 5px;
		border: 1px solid black;
	}

	.filter-deletion {
		padding: 0.2rem 0.4rem;
		margin: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: lightcoral;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
</style>
