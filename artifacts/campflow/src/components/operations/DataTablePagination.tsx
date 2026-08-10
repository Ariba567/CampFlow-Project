import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function DataTablePagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  // Coerce to numbers so arithmetic (page + 1 / page - 1) never degrades into
  // string concatenation if a backend ever returns page as a string.
  const current = Number(page);
  const pages = Number(totalPages);
  if (pages <= 1) return null;
  return <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground"><span>Page {current} of {pages}</span><Pagination className="mx-0 w-auto justify-end"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); if (current > 1) onPageChange(current - 1); }} className={current === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem><PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); if (current < pages) onPageChange(current + 1); }} className={current === pages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination></div>;
}
