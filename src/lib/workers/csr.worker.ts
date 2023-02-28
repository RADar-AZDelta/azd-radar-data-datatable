import type IFilter from '$lib/interfaces/IFilter';
import type IPaginated from '$lib/interfaces/IPaginated';
import type IScheme from '$lib/interfaces/IScheme';
import type ISort from '$lib/interfaces/ISort';
import { desc, escape, fromCSV, fromJSON, load, loadCSV, loadJSON } from 'arquero';

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

const updatePagination = async (
	data: [string, any][][],
	pagination: IPaginated
): Promise<Object> => {
	return new Promise((resolve, reject) => {
		let updatedPag: IPaginated = {
			currentPage: pagination.currentPage,
			rowsPerPage: pagination.rowsPerPage,
			totalPages: Math.ceil(data.length / pagination.rowsPerPage),
			totalRows: data.length
		};
		const results = data.slice(
			pagination.currentPage * pagination.rowsPerPage - pagination.rowsPerPage,
			pagination.rowsPerPage * pagination.currentPage
		);
		resolve({
			data: results,
			pag: updatedPag
		});
	});
};

const getColumns = async (): Promise<IScheme[]> => {
	return new Promise((resolve, reject) => {
		let cols: IScheme[] = [];
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
		resolve(cols);
	});
};

const getData = async (
	filePath: string,
	file: File,
	method: string,
	fileType: string,
	fetchOptions: Object
): Promise<any> => {
	return new Promise(async (resolve, reject) => {
		if (method == 'REST') {
			if (filePath && fileType == 'CSV') {
				const response = await fetch(filePath, fetchOptions);
				const data = await response.text();
				originalData = await fromCSV(data, { delimiter: ',' });
			} else if (filePath && fileType == 'JSON') {
				const response = await fetch(filePath, fetchOptions);
				let data;
				if (response.url.includes('data:application/json')) {
					data = atob(response.url.substring(29));
				} else {
					data = await response.json();
				}
				originalData = await fromJSON(data, { autoType: true });
			}
		} else if (method == 'file') {
			if (fileType == 'CSV') {
				const text = await file.text();
				originalData = await fromCSV(text, { delimiter: ',' });
			} else if (fileType == 'JSON') {
				const text = await file.text();
				originalData = await fromJSON(text, { autoType: true });
			}
		}
		resolve(originalData);
	});
};

onmessage = async ({
	data: { filePath, file, method, fileType, fetchOptions, filter, order, pagination }
}) => {
	await getData(filePath, file, method, fileType, fetchOptions);
	cols = await getColumns();
	let data = originalData;
	if (order) {
		data = await orderData(originalData, order);
	}
	data = await filterData(data, filter);
	if (pagination) {
		data = await updatePagination(data, pagination);
	}
	const message = {
		processedData: {
			data: data.data == undefined ? data : data.data,
			columns: cols,
			pagination: data.pag == undefined ? data.pagination : data.pag
		}
	};
	postMessage(message);
};

export {};
