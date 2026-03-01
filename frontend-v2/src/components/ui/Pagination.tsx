import { cn } from '../../lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)
  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  const btnBase =
    'inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-xs font-medium rounded border transition-colors focus:outline-none'
  const btnEnabled = 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
  const btnDisabled = 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
  const btnActive = 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'

  return (
    <div className="flex items-center justify-between px-1 pt-3 pb-1 flex-wrap gap-2">
      <p className="text-xs text-slate-400 tabular-nums">
        {from}–{to} de <span className="font-medium text-slate-600">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        {/* Primeiro */}
        <button
          className={cn(btnBase, currentPage === 1 ? btnDisabled : btnEnabled)}
          onClick={() => currentPage > 1 && onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Primeira página"
        >
          ««
        </button>

        {/* Anterior */}
        <button
          className={cn(btnBase, currentPage === 1 ? btnDisabled : btnEnabled)}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          ‹ Anterior
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                className={cn(btnBase, p === currentPage ? btnActive : btnEnabled)}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Mobile: current/total */}
        <span className="sm:hidden text-xs text-slate-500 px-2 tabular-nums">
          {currentPage}/{totalPages}
        </span>

        {/* Seguinte */}
        <button
          className={cn(btnBase, currentPage === totalPages ? btnDisabled : btnEnabled)}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          Seguinte ›
        </button>

        {/* Último */}
        <button
          className={cn(btnBase, currentPage === totalPages ? btnDisabled : btnEnabled)}
          onClick={() => currentPage < totalPages && onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
        >
          »»
        </button>
      </div>
    </div>
  )
}
