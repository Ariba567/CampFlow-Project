import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Check, Eye, Hourglass, Inbox, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { DataTable, type DataColumn } from '@/components/operations/DataTable';
import { DataTableControls } from '@/components/operations/DataTableControls';
import { DataTablePagination } from '@/components/operations/DataTablePagination';
import OperationsStatusBadge from '@/components/operations/OperationsStatusBadge';
import { apiError, idOf, labelOf, listReservations, updateReservationStatus, type ApiItem } from '@/services/operationsDashboardService';
import { toast } from 'sonner';

export default function DashboardAdminReservations() {
  const [data, setData] = useState<{ rows: ApiItem[]; page: number; totalPages: number }>({ rows: [], page: 1, totalPages: 1 });
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all'); const [sort, setSort] = useState('checkIn'); const [order, setOrder] = useState<'asc' | 'desc'>('asc'); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = (page = data.page) => { setLoading(true); listReservations({ page, limit: 20, search: search || undefined, status: filter === 'all' ? undefined : filter, sort, order }).then((result) => setData({ rows: result.data, page: result.meta.page, totalPages: result.meta.totalPages })).catch((caught) => setError(apiError(caught, 'We could not load reservations.'))).finally(() => setLoading(false)); };
  useEffect(() => { const timer = window.setTimeout(() => load(1), 180); return () => window.clearTimeout(timer); }, [search, filter, sort, order]);
  const changeStatus = async (reservation: ApiItem, status: 'confirmed' | 'cancelled') => { try { await updateReservationStatus(idOf(reservation), status); toast.success(status === 'confirmed' ? 'Booking approved' : 'Booking rejected and cancelled'); load(); } catch (caught) { setError(apiError(caught, 'We could not update this booking.')); } };

  const summary = useMemo(() => {
    const rows = data.rows;
    const pending = rows.filter((row) => row.status === 'pending').length;
    const approved = rows.filter((row) => row.status === 'confirmed').length;
    const cancelled = rows.filter((row) => row.status === 'cancelled').length;
    const upcoming = rows.filter((row) => row.status === 'confirmed' && row.checkIn && new Date(row.checkIn) >= new Date()).length;
    return { pending, approved, cancelled, upcoming };
  }, [data.rows]);

  const columns: DataColumn<ApiItem>[] = [
    { label: 'Reservation', sortKey: 'createdAt', cell: (row) => (
      <div>
        <p className="font-medium">{row.reservationNumber ?? idOf(row).slice(-6)}</p>
        <p className="text-xs text-muted-foreground">Booked {String(row.createdAt ?? '').slice(0, 10)}</p>
      </div>
    ) },
    { label: 'Guest', cell: (row) => (
      <div>
        <p className="font-medium">{row.customer?.firstName} {row.customer?.lastName}</p>
        <p className="text-xs text-muted-foreground">{row.customer?.email}</p>
      </div>
    ) },
    { label: 'Stay', sortKey: 'checkIn', cell: (row) => (
      <div>
        <p className="font-medium">{String(row.checkIn).slice(0, 10)}</p>
        <p className="text-xs text-muted-foreground">to {String(row.checkOut).slice(0, 10)} · {labelOf(row.campsite, 'Campsite')}</p>
      </div>
    ) },
    { label: 'Status', sortKey: 'status', cell: (row) => <OperationsStatusBadge status={row.status} /> },
    { label: 'Actions', className: 'text-right', cell: (row) => (
      <div className="flex justify-end gap-1">
        {row.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => void changeStatus(row, 'confirmed')}>
              <Check />Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void changeStatus(row, 'cancelled')} className="text-destructive hover:text-destructive">
              <X />Reject
            </Button>
          </>
        )}
        <Button size="icon" variant="ghost" title="Customer details" onClick={() => document.getElementById(`customer-${idOf(row)}`)?.scrollIntoView({ behavior: 'smooth' })}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Operations · Bookings</p>
          <h1 className="display-3 mt-3">Reservation management</h1>
          <p className="lede mt-3">
            Review booking requests, approve arrivals, and keep stay statuses current across your permitted campgrounds.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat icon={Hourglass} label="Pending review" value={summary.pending} detail="Awaiting approval" tone="accent" />
        <SummaryStat icon={Check} label="Approved" value={summary.approved} detail="On the books" tone="primary" />
        <SummaryStat icon={CalendarRange} label="Upcoming arrivals" value={summary.upcoming} detail="Future check-ins" tone="primary" />
        <SummaryStat icon={X} label="Cancelled" value={summary.cancelled} detail="Rejected or withdrawn" tone="muted" />
      </section>

      {error && <ErrorState title="Reservations unavailable" message={error} />}

      <Card className="overflow-hidden rounded-md border border-card-border bg-card">
        <DataTableControls
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          filterOptions={[
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Approved' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'completed', label: 'Completed' },
          ]}
          placeholder="Search reservation or guest…"
        />
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : data.rows.length ? (
          <>
            <DataTable
              columns={columns}
              rows={data.rows}
              rowKey={idOf}
              onSort={(key) => { setOrder(key === sort && order === 'asc' ? 'desc' : 'asc'); setSort(key); }}
            />
            <DataTablePagination page={data.page} totalPages={data.totalPages} onPageChange={load} />
          </>
        ) : (
          <CardContent className="grid place-items-center gap-2 p-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No reservations match these controls.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, detail, tone }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  detail: string;
  tone: 'primary' | 'accent' | 'muted';
}) {
  const toneClass =
    tone === 'accent' ? 'bg-accent/12 text-accent'
    : tone === 'muted' ? 'bg-muted text-muted-foreground'
    : 'bg-primary/10 text-primary';
  return (
    <Card className="rounded-md border border-card-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <span className={`grid h-8 w-8 place-items-center rounded-md ${toneClass}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        <p className="mt-4 font-serif text-3xl font-medium tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}