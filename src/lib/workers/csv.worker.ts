import type IFilter from '$lib/interfaces/IFilter';
import type IPaginated from '$lib/interfaces/IPaginated';
import type IScheme from '$lib/interfaces/IScheme';
import type ISort from '$lib/interfaces/ISort';
import { desc, escape, loadCSV } from 'arquero';

let originalData: any;
let cols: IScheme[];

const filterData = async (table: any, filters?: IFilter[]) => {
	return new Promise((resolve, reject) => {
		let filteredData: [string, any][][] = [];
		if (filters != undefined && filters.length > 0) {
			for (let filter of filters) {
				table = table.filter(
					escape((d: any) => {
						const type = cols.filter((col) => col.column == filter.column)[0].type;
						if (type == 0) {
							if (d[filter.column] != null) return d[filter.column].includes(filter.filter);
						} else if (type == 1 || type == 2) return d[filter.column] == filter.filter;
						else if (type == 3)
							return d[filter.column].getTime() == new Date(String(filter.filter)).getTime()!;
					})
				);
			}
		}
		filteredData = table.objects();

		filteredData = Array.from(new Set(filteredData));
		if (filteredData.length > 0) {
			for (let i = 0; i < filteredData.length; i++) {
				let data = [];
				for (let col of table._names) {
					data.push(filteredData[i][col]);
				}
				filteredData[i] = data;
			}
		} else {
			for (let i = 0; i < table._total; i++) {
				let data = [];
				for (let col of table._names) {
					data.push(table._data[col].data[i]);
				}
				filteredData.push(data);
			}
		}
		resolve(filteredData);
	});
};

const orderData = async (table: any, sorts: ISort[]): Promise<any> => {
	return new Promise((resolve, reject) => {
		let orderedTable = table;
		for (let sort of sorts) {
			if (sort.direction == 1) {
				orderedTable = orderedTable.orderby(sort.column);
			} else if (sort.direction == 2) {
				orderedTable = orderedTable.orderby(desc(sort.column));
			}
		}
		resolve(orderedTable);
	});
};

const updatePagination = async (data: [string, any][][], pagination: IPaginated) => {
	const results = data.slice(0, pagination.rowsPerPage);
	return results;
};

const getColumns = async () => {
	const cols = [];
	const columns = originalData._names;
	for (let col of columns) {
		let type = 0;
		if (/^\d+$/.test(originalData._data[col].data[0]) == true) type = 1;
		else if (originalData._data[col].data[0] == true || originalData._data[col].data[0] == false)
			type = 2;
		else if (
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/.test(
				originalData._data[col].data[0]
			) == true
		)
			type = 3;
		else type = 0;
		cols.push({
			column: col,
			type: type
		});
	}
	return cols;
};

onmessage = async ({ data: { filePath, filter, ordering, pagination } }) => {
	if (filePath) originalData = await loadCSV('../data/usage-testdata.csv', { delimiter: ',' });
	cols = await getColumns();
	let data = originalData;
	if (ordering) {
		data = await orderData(originalData, ordering);
	}
	data = await filterData(data, filter);
	if (pagination) {
		data = await updatePagination(data, pagination);
	}
	const message = {
		processedData: {
			data: data,
			columns: cols
		}
	};
	postMessage(message);
};

export {};
