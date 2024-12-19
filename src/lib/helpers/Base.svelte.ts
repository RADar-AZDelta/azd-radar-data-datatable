import Config from "./Config"
import type { FetchDataFunc, IColumnMetaData, IDataTypeFunctionalities, ITableOptions, ModifyColumnMetadataFunc, SortDirection, TFilter } from "../interfaces/Types"

export default class Base {
  options = $state<ITableOptions>()
  position: number = 0
  filter: TFilter = null
  sortColumn: string = ''
  filterColumn: string = ''
  positionColumn: string = ''
  reactiveTrigger: boolean = false
  renderStatus = $state<string>('')
  disabled = $state<boolean>(false)
  internalOptionsSet: boolean = false
  sortDirection: SortDirection = null
  originalIndices = $state<number[]>()
  renderedData = $state<any[] | any[][]>()
  rendered: Function | undefined = undefined
  rendering: undefined | Function = undefined
  initialized: Function | undefined = undefined
  initialisationCompleted = $state<boolean>(false)
  columns = $state<IColumnMetaData[] | undefined>()
  data = $state<any[] | any[][] | FetchDataFunc | File>()
  internalColumns = $state<IColumnMetaData[] | undefined>()
  dataTypeImpl = $state<IDataTypeFunctionalities | undefined>()
  internalOptions = $state<ITableOptions>(Config.defaultOptions)
  modifyColumnMetadata: ModifyColumnMetadataFunc | undefined = undefined
  visibleOrderedColumns = $derived(this.internalColumns?.filter(col => col.visible !== false).sort((a, b) => a.position! - b.position!))
}