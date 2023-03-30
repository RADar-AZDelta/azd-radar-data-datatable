import type IPaginated from './IPaginated'
import type IScheme from './IScheme'

interface IWorkerData {
  data: object[]
  columns: IScheme[]
  pagination?: IPaginated
  update?: boolean
  file?: File
  download?: boolean
}

export default interface IWorkerMessage {
  data: IWorkerData
}