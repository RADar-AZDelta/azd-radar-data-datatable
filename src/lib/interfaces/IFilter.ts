/**
 * Defines how to filter a column
 */
// boolean & datetime also possible
export interface IFilter {
	column: string;
	filter?: string | RegExp | number | boolean | Date;
}
