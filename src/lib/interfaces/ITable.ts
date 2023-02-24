import type IFilter from './IFilter';
import type ISort from './ISort';
import type IPaginated from './IPaginated';
import type ITableData from './ITableData';

/**
 * defines the basic structure of a table
 */
export default interface ITable {
	getData(): Promise<ITableData>;
	setColumnFilters(value: IFilter[]): void;
	setColumnSort(value: ISort[]): void;
	setTablePagination(tablePagination: IPaginated): void;
}
