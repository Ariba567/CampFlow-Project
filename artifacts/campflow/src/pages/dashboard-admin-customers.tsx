import { useEffect, useMemo, useState } from 'react';
import { Eye, Mail, Phone, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { DataTable, type DataColumn } from '@/components/operations/DataTable';
import { DataTableControls } from '@/components/operations/DataTableControls';
import { DataTablePagination } from '@/components/operations/DataTablePagination';
import { apiError, getCustomer, idOf, labelOf, listReservations, type ApiItem } from '@/services/operationsDashboardService';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardAdminCustomers() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ApiItem[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<ApiItem | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listReservations({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
      .then((result) => setReservations(result.data))
      .catch((caught) => setError(apiError(caught, 'We could not load customer information.')))
      .finally(() => setLoading(false));
  }, []);

  const customers = useMemo(() => {
    const entries = new Map<string, ApiItem>();
    reservations.forEach((reservation) => {
      const id = idOf(reservation.customer);
      if (!id) return;
      const existing = entries.get(id) ?? { ...reservation.customer, reservations: [] };
      existing.reservations.push(reservation);
      entries.set(id, existing);
    });
    const filtered = [...entries.values()].filter((item) =>
      `${item.firstName} ${item.lastName} ${item.email}`.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((left, right) => {
      const leftValue = sort === 'stays' ? left.reservations.length : `${left.firstName} ${left.lastName}`;
      const rightValue = sort === 'stays' ? right.reservations.length : `${right.firstName} ${right.lastName}`;
      return String(leftValue).localeCompare(String(rightValue)) * (order === 'asc' ? 1 : -1);
    });
  }, [reservations, search, sort, order]);

  const totals = useMemo(() => {
    const guestCount = customers.length;
    const stayCount = customers.reduce((sum, c) => sum + c.reservations.length, 0);
    const repeat = customers.filter((c) => c.reservations.length > 1).length;
    return { guestCount, stayCount, repeat };
  }, [customers]);

  const totalPages = Math.max(Math.ceil(customers.length / 12), 1);
  const rows = customers.slice((page - 1) * 12, page * 12);
  useEffect(() => setPage(1), [search, sort, order]);

  const openCustomer = async (item: ApiItem) => {
    if (user?.role !== 'admin') { setCustomer(item); return; }
    setCustomerLoading(true);
    try { setCustomer(await getCustomer(idOf(item))); }
    catch (caught) { setError(apiError(caught, 'We could not load this customer.')); }
    finally { setCustomerLoading(false); }
  };

  const columns: DataColumn<ApiItem>[] = [
    { label: 'Guest', sortKey: 'name', cell: (row) => {
      const initial = `${row.firstName?.[0] ?? ''}${row.lastName?.[0] ?? ''}`.toUpperCase() || '·';
      return (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-serif text-sm font-medium text-primary">
            {initial}
          </span>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      );
    } },
    { label: 'Reservations', sortKey: 'stays', cell: (row) => {
      const count = row.reservations.length;
      const tone = count > 1 ? 'text-primary' : 'text-muted-foreground';
      return <span className={`font-medium ${tone}`}>{count} stay{count === 1 ? '' : 's'}</span>;
    } },
    { label: 'Latest stay', cell: (row) => {
      const stay = row.reservations[0];
      return (
        <div>
          <p className="text-sm font-medium">{String(stay?.checkIn ?? '').slice(0, 10) || '—'}</p>
          <p className="text-xs text-muted-foreground">{labelOf(stay?.campground, 'Campground')}</p>
        </div>
      );
    } },
    { label: '', className: 'text-right', cell: (row) => (
      <Button variant="ghost" size="sm" onClick={() => void openCustomer(row)}>
        <Eye />View
      </Button>
    ) },
  ];

  if (error) return <ErrorState title="Customers unavailable" message={error} />;

  return (
    <div className="space-y-8">
      <section className="grid gap-8 border-b border-border pb-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow">Operations · Guest ledger</p>
          <h1 className="display-2 mt-3">Customer information</h1>
          <p className="lede mt-4 max-w-xl">
            A read-only directory of guests connected to reservations across your permitted campgrounds. Search by name or email to find a guest and review their stay history.
          </p>
        </div>
        <Card className="rounded-md border border-card-border bg-card">
          <CardContent className="grid grid-cols-3 divide-x divide-border">
            <LedgerStat label="Guests" value={totals.guestCount} />
            <LedgerStat label="Stays" value={totals.stayCount} />
            <LedgerStat label="Returning" value={totals.repeat} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden rounded-md border border-card-border bg-card">
        <DataTableControls
          search={search}
          onSearch={setSearch}
          filter="all"
          onFilter={() => undefined}
          filterOptions={[{ value: 'all', label: user?.role === 'admin' ? 'All customers' : 'Your guests' }]}
          placeholder="Search customers…"
        />
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : rows.length ? (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={idOf}
              onSort={(key) => { setOrder(key === sort && order === 'asc' ? 'desc' : 'asc'); setSort(key); }}
            />
            <DataTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <CardContent className="grid place-items-center gap-2 p-12 text-center">
            <UsersRound className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No customers match this search.</p>
          </CardContent>
        )}
      </Card>

      <Dialog open={!!customer || customerLoading} onOpenChange={(open) => !open && setCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Guest profile</DialogTitle>
          </DialogHeader>
          {customerLoading ? (
            <div className="grid min-h-32 place-items-center">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : customer && (
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary font-serif text-base font-medium text-primary">
                  {`${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '·'}
                </span>
                <div>
                  <p className="font-serif text-lg font-medium">{customer.firstName} {customer.lastName}</p>
                  <p className="text-xs text-muted-foreground">Guest since {String(customer.createdAt ?? '').slice(0, 10) || '—'}</p>
                </div>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <CustomerField icon={Mail} label="Email" value={customer.email} />
                {customer.phone && <CustomerField icon={Phone} label="Phone" value={customer.phone} />}
              </dl>
              {customer.address && (
                <div>
                  <p className="eyebrow">Address</p>
                  <p className="mt-2 text-sm">
                    {[customer.address.street, customer.address.city, customer.address.state, customer.address.zip].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <p className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                {user?.role === 'admin'
                  ? 'Full organization customer profile. Edit through the account manager if updates are needed.'
                  : 'Manager view is limited to contact data included with reservations.'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LedgerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-5 first:pl-0 last:pr-0">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

function CustomerField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow flex items-center gap-1.5"><Icon className="h-3 w-3" /> {label}</p>
      <p className="mt-2 break-words text-sm">{value || '—'}</p>
    </div>
  );
}