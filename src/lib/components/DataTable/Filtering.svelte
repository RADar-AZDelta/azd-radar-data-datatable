<script lang="ts">
	import type { Types } from "$lib/classes/enums/Types";

    export let col: string, type: Types, updateFiltering: Function, deleteFilter: Function;
</script>

<div class="input-filter">
    <input
        on:change={updateFiltering(event, type)}
        class="input-filtering"
        name={col}
        type={type == 0 ? 'text' : type == 1 ? 'number' : type == 2 ? 'checkbox': 'date'}
        placeholder="filter by {col}"
    />
    <button class="delete-button" on:click={deleteFilter(col)}><img src="/x.svg" alt="Cross icon" ></button >
</div>

<style>
    .input-filter {
		display: flex;
		align-items: center;
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

    .delete-button {
		position: relative;
		display: flex;
		align-items: center;
		right: 2.5rem;
        top: -0.25rem;
		border: none;
		background-color: inherit;
        cursor: pointer;
	}
</style>
