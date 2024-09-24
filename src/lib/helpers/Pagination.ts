import { getDataTable } from '$lib/stores/store.svelte'
import optionsClass from './Options.svelte'

class Pagination {
    async onPaginationChanged(rowsPerPage: number, currentPage: number, paginationChanged?: (page: number, rowsPerPage: number) => Promise<void>) {
        if (rowsPerPage !== optionsClass.internalOptions.rowsPerPage) optionsClass.internalOptions.currentPage = 1
        else optionsClass.internalOptions.currentPage = currentPage
        optionsClass.internalOptions.rowsPerPage = rowsPerPage
        if (paginationChanged) await paginationChanged(currentPage, rowsPerPage)
        getDataTable().dataTable?.render()
        // await render(true)
    }

    async getTablePagination() {
        const { currentPage, rowsPerPage, totalRows } = optionsClass.internalOptions
        return { currentPage, rowsPerPage, totalRows }
    }

    async changePagination(pag: { currentPage?: number; rowsPerPage?: number }) {
        if (pag.currentPage) optionsClass.internalOptions.currentPage = pag.currentPage
        if (pag.rowsPerPage) optionsClass.internalOptions.rowsPerPage = pag.rowsPerPage
        getDataTable().dataTable?.render()
        // await render(true)
    }
}

const pagination = new Pagination()
export default pagination