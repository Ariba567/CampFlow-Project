import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function DataTablePagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground"><span>Page {page} of {totalPages}</span><Pagination className="mx-0 w-auto justify-end"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); if (page > 1) onPageChange(page - 1); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem><PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); if (page < totalPages) onPageChange(page + 1); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination></div>;
}
