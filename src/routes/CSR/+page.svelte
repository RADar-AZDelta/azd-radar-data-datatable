<script lang="ts">
	import DataTableRendererCsr from '$lib/components/DataTable/DataTableRendererCSR.svelte';

	const urlJSON = 'https://jsonplaceholder.typicode.com/posts';
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

	const transpileData = async (data: any) => {
		/*
			For Arquero column store
			Example:

			{
				a: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10"],
				b: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10"]
			}

			Here are "a" and "b" the columns and the values are the data
		*/
		const columns = [];
		const dataFound: any = {};
		for (let key in data[0]) {
			columns.push(key);
		}
		for (let col of columns) {
			const d = [];
			for (let obj of data) {
				d.push(obj[col]);
			}
			dataFound[col] = d;
		}

		return dataFound;
	};
</script>

<h1>RADar-DataTable Demo - REST data</h1>
<p>
	This page demonstrates how the already manipulated data gets fetched from the API and rendered in
	the DataTable.
</p>
<DataTableRendererCsr url={urlCSV} fetchOptions={fetchOptionsCSV} />
