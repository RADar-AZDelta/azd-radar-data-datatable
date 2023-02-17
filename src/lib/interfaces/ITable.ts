import type {IFilter} from "./IFilter";
import type {ISort} from "./ISort";
import type IPaginated from "./IPaginated";
import type {ITableData} from "./ITableData";

/**
 * defines the basic structure of a table
 */
export default interface ITable {
    setData(): void;
    getData(columnFilters?: IFilter[], columnSorts?: ISort[], tablePagination?: IPaginated): Promise<ITableData>;
    setColumnFilter(col: string, value: IFilter): void;
    setColumnSort(col: string, value: ISort): void;
}