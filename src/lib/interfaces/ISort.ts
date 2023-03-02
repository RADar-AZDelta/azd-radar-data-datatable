/**
 * Defines how to sort a column
 */
export interface ISort {
  column: string
  apply: (value: never[]) => never[]
}
