import Data from './data/Data.svelte'

export default class Pagination extends Data {
  async _onPaginationChanged(rowsPerPage: number, currentPage: number) {
    if (rowsPerPage !== this.internalOptions.rowsPerPage) this.internalOptions.currentPage = 1
    else this.internalOptions.currentPage = currentPage
    this.internalOptions.rowsPerPage = rowsPerPage
  }

  _getTablePagination() {
    const { currentPage, rowsPerPage, totalRows } = this.internalOptions
    return { currentPage, rowsPerPage, totalRows }
  }

  async _changePagination(pag: { currentPage?: number; rowsPerPage?: number }) {
    if (pag.currentPage) this.internalOptions.currentPage = pag.currentPage
    if (pag.rowsPerPage) this.internalOptions.rowsPerPage = pag.rowsPerPage
  }
}
