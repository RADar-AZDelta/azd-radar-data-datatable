import type { SortDirection } from '$lib/classes/enums/SortDirection';

/**
 * Defines how to sort a column
 */
export interface ISort {
	column: string;
	direction: SortDirection;
}
