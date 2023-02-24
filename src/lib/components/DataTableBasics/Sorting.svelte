<script lang="ts">
	export let col: string, direction: number, updateSorting: Function;

	const sortColumn = async () => {
		if (direction == 2) direction = 0;
		else direction = direction++;
		console.log("sorting from inner child ", col, direction)
		updateSorting(col, direction);
	};
</script>

<div class="table-header-element">
	<button on:click={sortColumn} class="table-head">
		<p class="column-name">{col}</p>
		{#if direction == 0}
			<img src="/no-sort.svg" alt="No filter icon" />
		{:else if direction == 1}
			<img src="/ascending-sort.svg" alt="Ascending filter icon" />
		{:else if direction == 2}
			<img src="/descending-sort.svg" alt="Descending filter icon" />
		{:else}
			<p>Something went wrong!</p>
		{/if}
	</button>
</div>

<style scoped>
	.table-header-element {
		width: 80%;
		display: flex;
		align-items: center;
		gap: 2rem;
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

	.column-name {
		font-weight: 800;
		font-size: 1rem;
	}
</style>
