import type IColumnName from './IColumnName'

export default interface IMapper {
  mappingURL: string
  mappingFetchOptions: object
  mappingFileType: string
  mappingDelimiter: string
  contentPath: string[]
  expectedColumns: IColumnName[]
  additionalFields?: object
}
