import type SortDirection from '$lib/classes/enums/SortDirection'

/**
 * Defines how to sort a column
 */
export default interface ISort {
  column: string
  direction: SortDirection
}
