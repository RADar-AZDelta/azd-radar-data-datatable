/**
 * Defines how to paginate a table
 */
export default interface IPaginated {
  currentPage: number
  totalPages: number
  rowsPerPage: number
  totalRows: number
}
