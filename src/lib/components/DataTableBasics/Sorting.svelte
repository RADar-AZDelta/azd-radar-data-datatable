<script lang="ts">
	export let col: string, direction: number, updateSorting: Function;

	const sortColumn = async () => {
		if (direction == 2) direction = 0;
		else direction = direction++;
		updateSorting(col, direction);
	};
</script>

<div data-component="sort">
	<button on:click={sortColumn}>
		<p data-component="column-name">{col}</p>
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