import { from } from 'arquero'
import Crud from '../workers/FileWorkerCrud'
import type { ITableFilter, SortDirection } from '../interfaces/Types'
import type { MessageRequestExecuteExpressionsAndReturnResults, MessageRequestExecuteQueryAndReturnResults } from '../workers/messages'

export default class Query extends Crud {
  async executeQueryAndReturnResults(proxy: MessageRequestExecuteQueryAndReturnResults) {
    if (!this.dt) return { queriedData: [], indices: [] }
    let tempDt = await this.applyMultipleFilters(await proxy.filteredColumns, this.dt)
    tempDt = await this.sortTempDt(await proxy.sortedColumns, tempDt)
    const { queriedDt, queriedData } = await this.executeQuery(tempDt, proxy.usedQuery)
    const { indices } = await this.getIndices(queriedDt, this.dt, await proxy.sortedColumns)
    return { queriedData, indices }
  }

  private async executeQuery(tempDt: any, query: ITableFilter) {
    const data = tempDt.objects()
    const { results: queriedData } = await this.useFilter(data, query)
    const queriedDt = from(queriedData)
    return { queriedData, queriedDt }
  }

  private async useFilter(data: any[], query: ITableFilter) {
    const mappedResults = await Promise.all(data.map(async (row, index) => await query({ row, index }) ? row : undefined))
    const results = mappedResults.filter(row => row)
    return { results }
  }

  private async getIndices(queriedDt: any, tempDt: any, sortedColumns: Map<string, SortDirection>) {
    const columns: Record<string, any> = {}
    queriedDt._names.forEach((col: any) => (columns[col] = () => 0))
    if(!Object.keys(columns).length) return { indices: [] }
    const imputedDt = tempDt.impute(columns)
    const tempQueriedDt = queriedDt.impute(columns)
    let joined = imputedDt.semijoin(tempQueriedDt)
    joined = await this.sortTempDt(sortedColumns, joined)
    const indices = joined.indices()
    return { indices }
  }

  async executeExpressionsAndReturnResults({ expressions }: MessageRequestExecuteExpressionsAndReturnResults) {
    return Object.keys(expressions).reduce((acc: any[], cur: string) => (acc = [...acc, this.dt?.rollup({ [cur]: expressions[cur] }).object()]), [])
  }
}
