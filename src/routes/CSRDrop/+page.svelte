<script lang="ts">
	import DataTableRendererCsrDrop from "$lib/components/DataTable/DataTableRendererCSRDrop.svelte";
	import DragAndDrop from '$lib/components/Extra/DragAndDrop.svelte';
	import { writable } from "svelte/store";

	const file = writable<File | null>(null);
	const fileExtension = 'csv';
</script>

<DragAndDrop {file} {fileExtension} />
{#if $file != null}
    <DataTableRendererCsrDrop file={$file}/>
{/if}