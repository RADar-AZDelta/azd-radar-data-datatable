/**
 * Defines how to filter a column
 */
export default interface IFilter {
	column: string;
	filter: string | RegExp | number | boolean | Date;
}
