import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export default function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#listing" onClick={(event) => { event.preventDefault(); onPageChange(Math.max(1, page - 1)); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <PaginationItem key={number}><PaginationLink href="#listing" isActive={page === number} onClick={(event) => { event.preventDefault(); onPageChange(number); }}>{number}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext href="#listing" onClick={(event) => { event.preventDefault(); onPageChange(Math.min(totalPages, page + 1)); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination>;
}
