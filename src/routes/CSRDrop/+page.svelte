<script lang="ts">
	import DataTableRendererCsr from "$lib/components/DataTable/DataTableRendererCSR.svelte";
	import DragAndDrop from '$lib/components/Extra/DragAndDrop.svelte';
	import { writable } from "svelte/store";

	const file = writable<File | null>(null);
	const fileExtension = 'csv';
	const delimiter = ",";
</script>

<DragAndDrop {file} {fileExtension} />
{#if $file != null}
    <DataTableRendererCsr file={$file} dataType={fileExtension} {delimiter}/>
{/if}