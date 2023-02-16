import type { IFilter } from "./IFilter";
import type { ISort } from "./ISort";

export default interface ITable {
    setData(): void;
    getData(): void;
    setColumnFilter(col: string, value: IFilter): void;
    setColumnSort(col: string, value: ISort): void;
}