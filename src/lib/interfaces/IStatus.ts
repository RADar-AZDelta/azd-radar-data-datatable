import type IColor from "./IColor"

export default interface IStatus {
    columnName: string
    statuses: IColor[]
}