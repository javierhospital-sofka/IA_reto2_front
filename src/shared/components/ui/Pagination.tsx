/**
 * Client-side pagination component.
 *
 * Why client-side: lists are scoped per inventory and stay small (<10k items).
 * For larger sets the API supports pagination params and this component can be
 * upgraded later without touching call sites.
 */

import type { JSX } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange
}: PaginationProps): JSX.Element | null {
  if (total <= pageSize) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination__summary">
        {from}–{to} de {total}
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} aria-hidden /> Anterior
        </button>
        <span aria-current="page" className="pagination__page">
          Página {safePage} de {totalPages}
        </span>
        <button
          type="button"
          className="pagination__btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Página siguiente"
        >
          Siguiente <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
}
