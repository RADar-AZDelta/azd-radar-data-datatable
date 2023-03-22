import type IColumn from './IColumn'

export default interface IMapping {
  mappingURL: string
  mappingFetchOptions: object
  mappingFileType: string
  mappingDelimiter: string
  contentPath: string[]
  expectedColumns: IColumn[]
  additionalFields?: object
}
