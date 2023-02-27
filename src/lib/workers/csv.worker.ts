import type IScheme from '$lib/interfaces/IScheme';
import { escape, loadCSV, query } from 'arquero';

let originalData: any;
let cols: IScheme[];
let data: any;

const filterData = async (table: any, filters?: any) => {
	let filteredData: [string, any][][] = [];
	if (filters != undefined && filters.length > 0) {
        for(let filter of filters){
            table = table.filter(escape((d: any) => {
                const type = cols.filter((col) => col.column == filter.column)[0].type;
                if (type == 0) {
                    if (d[filter.column] != null) return d[filter.column].includes(filter.filter);
                } else if (type == 1 || type == 2) return d[filter.column] == filter.filter;
                else if (type == 3) return d[filter.column].getTime() == filter.filter.getTime();
            }))
        }
        const res = table.objects()
        filteredData = res
	}

    filteredData = Array.from(new Set(filteredData))
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
	return filteredData;
};

const orderData = async () => {
	// console.log("ordering")
};

const updatePagination = async () => {
	// console.log("updating pagination")
};

const getColumns = async (table: any) => {
	const cols = [];
	const columns = table._names;
	for (let col of columns) {
		let type = 0;
		// if(table._data[col].data[0].test(/^\d+$/) == true) type = 1
		if (/^\d+$/.test(table._data[col].data[0]) == true) type = 1;
		else if (table._data[col].data[0] == true || table._data[col].data[0] == false) type = 2;
		else if (
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/.test(table._data[col].data[0]) ==
			true
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
	cols = await getColumns(originalData);
	data = await filterData(originalData, filter);
	if (ordering) {
		await orderData();
	}
	if (pagination) {
		await updatePagination();
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
