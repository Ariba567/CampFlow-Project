import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type DataColumn<T> = { label: string; cell: (row: T) => React.ReactNode; sortKey?: string; className?: string };

export function DataTable<T>({ columns, rows, rowKey, onSort }: { columns: DataColumn<T>[]; rows: T[]; rowKey: (row: T) => string; onSort?: (key: string) => void }) {
  return <Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column.label} className={column.className}>{column.sortKey ? <Button variant="ghost" size="sm" className="-ml-3 h-8 px-3" onClick={() => onSort?.(column.sortKey!)}>{column.label}<ArrowUpDown className="ml-1 h-3.5 w-3.5" /></Button> : column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={rowKey(row)}>{columns.map((column) => <TableCell key={column.label} className={column.className}>{column.cell(row)}</TableCell>)}</TableRow>)}</TableBody></Table>;
}
