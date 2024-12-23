//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
import { expose } from 'comlink'
import type {
  MessageRequestSaveToFile,
  MessageRequestFetchData,
  MessageRequestLoadFile,
  MessageRequestUpdateRows,
  MessageRequestInsertRows,
  MessageRequestDeleteRows,
  MessageRequestGetRow,
  MessageRequestInsertColumns,
  MessageRequestExecuteQueryAndReturnResults,
  MessageRequestExecuteExpressionsAndReturnResults,
  MessageRequestReplaceValuesOfColumn,
  MessageRequestGetBlob,
  MessageRequestChangeRow,
} from '@dtlib/workers/messages'
import FileWorker from '@dtlib/workers/FileWorker'

const fileWorker = new FileWorker()

const loadFile = async (data: MessageRequestLoadFile) => await fileWorker.loadFile(data)

const getColumnNames = () => fileWorker.getColumnNames()

const fetchData = async (data: MessageRequestFetchData) => await fileWorker.fetchData(data)

const saveToFile = async (opts: MessageRequestSaveToFile) => await fileWorker.saveToFile(opts)

const getBlob = async (opts: MessageRequestGetBlob) => await fileWorker.getBlob(opts)

const updateRows = async (opts: MessageRequestUpdateRows) => await fileWorker.updateRows(opts)

const insertRows = async (opts: MessageRequestInsertRows) => fileWorker.insertRows(opts)

const deleteRows = async (opts: MessageRequestDeleteRows) => await fileWorker.deleteRows(opts)

const getRow = (opts: MessageRequestGetRow) => fileWorker.getRow(opts)

const getNextRow = async (opts: MessageRequestChangeRow) => await fileWorker.getNextRow(opts)

const getPreviousRow = async (opts: MessageRequestChangeRow) => await fileWorker.getPreviousRow(opts)

const insertColumns = async (opts: MessageRequestInsertColumns) => await fileWorker.insertColumns(opts)

const executeQueryAndReturnResults = async (opts: MessageRequestExecuteQueryAndReturnResults) => await fileWorker.executeQueryAndReturnResults(opts)

const executeExpressionsAndReturnResults = async (opts: MessageRequestExecuteExpressionsAndReturnResults) =>
  await fileWorker.executeExpressionsAndReturnResults(opts)

const replaceValuesOfColumn = async (opts: MessageRequestReplaceValuesOfColumn) => await fileWorker.replaceValuesOfColumn(opts)

const exposed = {
  loadFile,
  getColumnNames,
  fetchData,
  saveToFile,
  getBlob,
  updateRows,
  insertRows,
  deleteRows,
  getRow,
  getNextRow,
  getPreviousRow,
  insertColumns,
  executeQueryAndReturnResults,
  executeExpressionsAndReturnResults,
  replaceValuesOfColumn,
}

expose(exposed)
