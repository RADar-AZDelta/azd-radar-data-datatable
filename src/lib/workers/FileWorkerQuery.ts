import { queryFrom } from 'arquero'
import Crud from '@dtlib/workers/FileWorkerCrud'
import type Table from 'arquero/dist/types/table/table'
import type { MessageRequestExecuteExpressionsAndReturnResults, MessageRequestExecuteQueryAndReturnResults } from '@dtlib/workers/messages'

export default class Query extends Crud {
  async executeQueryAndReturnResults({ usedQuery, filteredColumns, sortedColumns }: MessageRequestExecuteQueryAndReturnResults) {
    if (!this.dt) return { queriedData: [], indices: [] }
    let tempDt = await this.applyMultipleFilters(filteredColumns, this.dt)
    tempDt = await this.sortTempDt(sortedColumns, tempDt)
    const { queriedData, queriedDt } = await this.executeQuery(tempDt, usedQuery)
    const { indices } = await this.getIndices(queriedDt, tempDt)
    return { queriedData, indices }
  }

  private async executeQuery(tempDt: Table, query: object) {
    const newQuery = queryFrom(query)
    const queriedDt = newQuery.evaluate(tempDt, () => true)
    const queriedData = queriedDt.objects()
    return { queriedData, queriedDt }
  }

  private async getIndices(queriedDt: Table, tempDt: Table) {
    const columns: Record<string, any> = {}
    queriedDt._names.forEach(col => (columns[col] = () => 0))
    const imputedDt = tempDt.impute(columns)
    const tempQueriedDt = queriedDt.impute(columns)
    const indices = imputedDt.semijoin(tempQueriedDt).indices()
    return { indices }
  }

  async executeExpressionsAndReturnResults({ expressions }: MessageRequestExecuteExpressionsAndReturnResults) {
    return Object.keys(expressions).reduce((acc: any[], cur: string) => (acc = [...acc, this.dt?.rollup({ [cur]: expressions[cur] }).object()]), [])
  }
}
