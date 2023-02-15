export interface IFilter {
    apply: (value: never[]) => never[]
}