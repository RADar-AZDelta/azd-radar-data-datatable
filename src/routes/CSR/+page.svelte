<script lang="ts">
	import DataTableRendererCsr from '$lib/components/DataTable/DataTableRendererCSR.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

	const urlJSON = "data:application/json;base64,"+btoa(JSON.stringify(data.data))
	const urlCSV =
		'https://raw.githubusercontent.com/RADar-AZDelta/AZDelta-OMOP-CDM/main/observation/observation_concept_id/mzg_usagi.csv';
	const fetchOptionsJSON = {
		method: 'GET',
		header: {
			'Content-Type': 'application/json'
		}
	};
	const fetchOptionsCSV = {
		method: 'GET',
		header: {
			'Content-Type': 'text/csv;charset=UTF-8'
		}
	};

	const delimiter: string = "," // Specific for CSV
</script>

<h1>RADar-DataTable Demo - REST data</h1>
<p>
	This page demonstrates how the already manipulated data gets fetched from the API and rendered in
	the DataTable.
</p>
<!-- <DataTableRendererCsr url={urlCSV} fetchOptions={fetchOptionsCSV} dataType="CSV" {delimiter} /> -->
<DataTableRendererCsr url={urlJSON} fetchOptions={fetchOptionsJSON} dataType="JSON" />
