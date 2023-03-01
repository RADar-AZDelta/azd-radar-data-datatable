<script lang="ts">
	import type Types from '$lib/classes/enums/Types';
	import type IFilter from '$lib/interfaces/IFilter';

	export let col: string, type: Types, updateFiltering: Function, deleteFilter: Function, filter: IFilter;
</script>

<div data-component="filter">
	<input
		on:change={updateFiltering(event, type)}
		name={col}
		type={type == 0 ? 'text' : type == 1 ? 'number' : type == 2 ? 'checkbox' : 'date'}
		value={filter == undefined? '':filter.filter}
		placeholder="filter by {col}"
	/>
	<button on:click={deleteFilter(col)}
		><img src="/x.svg" alt="Cross icon" /></button
	>
</div>
