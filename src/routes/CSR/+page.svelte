<script lang="ts">
    import type IFilter from '$lib/interfaces/IFilter';
	import type IPaginated from '$lib/interfaces/IPaginated';
	import type ISort from '$lib/interfaces/ISort';

	const url = 'https://jsonplaceholder.typicode.com/posts';
	const fetchOptions = {
		method: 'GET',
		header: {
			'Content-Type': 'application/json'
		}
	};
	const pagination: IPaginated = {
		currentPage: 1,
		totalPages: 3,
		rowsPerPage: 10,
		totalRows: 30
	};

	const filters: IFilter[] = [
		{
			column: 'title',
			filter: 'aut'
		}
	];
	const sorting: ISort[] = [
		{
			column: 'id',
			direction: 2
		}
	];
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
