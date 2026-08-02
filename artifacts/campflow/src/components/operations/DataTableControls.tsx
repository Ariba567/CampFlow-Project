import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DataTableControls({ search, onSearch, filter, onFilter, filterOptions, placeholder = 'Search records…' }: { search: string; onSearch: (value: string) => void; filter: string; onFilter: (value: string) => void; filterOptions: { value: string; label: string }[]; placeholder?: string }) {
  return <div className="flex flex-col gap-3 border-b bg-muted/25 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} className="pl-9" /></div><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /><Select value={filter} onValueChange={onFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent>{filterOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div>;
}
