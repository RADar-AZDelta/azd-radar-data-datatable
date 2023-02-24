<script lang="ts">
	import type ITableData from '$lib/interfaces/ITableData';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import { writable } from 'svelte/store';

	export let updateRowsPerPage: Function,
		changePage: Function,
		data: ITableData,
		pagination: IPaginated;   

	// const skippedPages = writable<number>(0)
	// let update = 0

	// const updatePage = async() => {
	// 	update += 1
	// }

	// const updatePagination = async(chosenPage: number) => {
	// 	if (pagination.currentPage + 1 == chosenPage) skippedPages.update(n => n + 1)
	// 	if (pagination.currentPage - 1 == chosenPage) skippedPages.update(n => n - 1)
	// 	console.log(pagination.currentPage)
	// 	console.log(chosenPage)
	// 	console.log($skippedPages)
	// 	changePage(chosenPage)
	// 	updatePage()
	// }

	// pagination.totalPages = 20
</script>

<section class="table-information">
	<div class="table-rows">
		<p>Rows:</p>
		<select
			bind:value={pagination.rowsPerPage}
			class="table-rows-select"
			id="rows"
			on:change={() => updateRowsPerPage(event)}
		>
			<option value="10">10</option>
			<option value="20">20</option>
			<option value="50">50</option>
			<option value="100">100</option>
		</select>
		<p>
			{pagination.rowsPerPage * pagination.currentPage + 1 - pagination.rowsPerPage}-{data.data
				.length -
				pagination.rowsPerPage * pagination.currentPage >
			0
				? pagination.rowsPerPage
				: pagination.rowsPerPage -
				  (pagination.rowsPerPage * pagination.currentPage - data.data.length) +
				  pagination.rowsPerPage * (pagination.currentPage - 1)} of {data.data.length}
		</p>
	</div>
	<div class="pagination">
		<button
			on:click={() => changePage(pagination.currentPage - 1)}
			class={`arrow-button ${pagination.currentPage == 1 ? 'arrow-button-disable' : null}`}
			><img src="/arrow-left.svg" alt="Arrow left" /></button
		>
		{#each Array(pagination.totalPages > 7?7:pagination.totalPages) as _, i}
			<button
				on:click={() => {
					changePage(i + 1);
				}}
				class="pagination-page"
			>
				<p class={`${i + 1 == pagination.currentPage ? 'pagination-page-selected' : null}`}>
					{i + 1}
				</p>
			</button>
		{/each}
		<button
			on:click={() => changePage(pagination.currentPage + 1)}
			class={`arrow-button ${
				pagination.currentPage == pagination.totalPages ? 'arrow-button-disable' : null
			}`}><img src="/arrow-right.svg" alt="Arrow right" /></button
		>
	</div>
</section>

<style>
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

    .arrow-button {
		background-color: inherit;
		border: none;
		cursor: pointer;
	}

	.arrow-button-disable {
		cursor: auto;
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
</style>
