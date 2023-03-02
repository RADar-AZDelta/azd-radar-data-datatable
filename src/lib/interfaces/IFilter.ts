/**
 * Defines how to filter a column
 */
export interface IFilter {
  column: string
  apply: (value: never[]) => never[]
}
