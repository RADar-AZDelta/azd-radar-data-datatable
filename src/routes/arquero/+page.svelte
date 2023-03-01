<script lang="ts">
	import DataTableRendererArquero from '$lib/components/DataTable/DataTableRendererArquero.svelte';
	const fileName = "medicatie_usagi.csv"
	const delimiter = ","
	// TODO: implement drag & drop API
</script>

<main>
	<h1>RADar-DataTable Demo - CSV data</h1>
	<p>This page demonstrates CSV data with the package Arquero.</p>
	<DataTableRendererArquero {fileName} {delimiter}/>
</main>