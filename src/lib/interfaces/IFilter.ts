/**
 * Defines how to filter a column
 */
export interface IFilter {
	column: string;
	filter?: string | RegExp;
}
