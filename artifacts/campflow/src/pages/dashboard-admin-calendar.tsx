import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import OperationsStatusBadge from '@/components/operations/OperationsStatusBadge';
import { apiError, labelOf, listReservations, type ApiItem } from '@/services/operationsDashboardService';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const sameDay = (left: Date, right: Date) => left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);

const statusTone: Record<string, string> = {
  confirmed: 'bg-primary/12 text-primary border-primary/25',
  pending: 'bg-accent/14 text-accent border-accent/30',
  cancelled: 'bg-destructive/12 text-destructive border-destructive/25 line-through opacity-80',
  completed: 'bg-secondary text-secondary-foreground border-border',
  no_show: 'bg-muted text-muted-foreground border-border',
};

export default function DashboardAdminCalendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [reservations, setReservations] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();
    setLoading(true);
    listReservations({ page: 1, limit: 100, checkInFrom: start, checkInTo: end, sort: 'checkIn', order: 'asc' })
      .then((result) => setReservations(result.data))
      .catch((caught) => setError(apiError(caught, 'We could not load the booking calendar.')))
      .finally(() => setLoading(false));
  }, [month]);

  const days = useMemo(() => {
    const firstDay = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: firstDay + count }, (_, index) =>
      index < firstDay ? null : new Date(month.getFullYear(), month.getMonth(), index - firstDay + 1)
    );
  }, [month]);

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, ApiItem[]>();
    reservations.forEach((reservation) => {
      const key = new Date(reservation.checkIn).toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(reservation);
      map.set(key, list);
    });
    return map;
  }, [reservations]);

  const monthStats = useMemo(() => {
    const total = reservations.length;
    const approved = reservations.filter((r) => r.status === 'confirmed').length;
    const pending = reservations.filter((r) => r.status === 'pending').length;
    const cancelled = reservations.filter((r) => r.status === 'cancelled').length;
    const busyDays = reservationsByDay.size;
    return { total, approved, pending, cancelled, busyDays };
  }, [reservations, reservationsByDay]);

  const changeMonth = (amount: number) =>
    setMonth((value) => new Date(value.getFullYear(), value.getMonth() + amount, 1));

  if (error) return <ErrorState title="Calendar unavailable" message={error} />;

  const today = new Date();

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Operations · Schedule</p>
          <h1 className="display-3 mt-3">Booking calendar</h1>
          <p className="lede mt-3">
            A monthly view of check-ins across your permitted campgrounds. Each cell shows the arrivals landing that day.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-44 px-3 text-center font-serif text-lg font-medium tracking-tight">
            {monthFormatter.format(month)}
          </p>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MonthStat label="Total arrivals" value={monthStats.total} detail="Across the month" />
        <MonthStat label="Approved" value={monthStats.approved} detail="Confirmed bookings" tone="primary" />
        <MonthStat label="Pending" value={monthStats.pending} detail="Awaiting review" tone="accent" />
        <MonthStat label="Cancelled" value={monthStats.cancelled} detail="No longer arriving" tone="muted" />
        <MonthStat label="Active days" value={monthStats.busyDays} detail="Days with arrivals" tone="sand" />
      </section>

      <Card className="overflow-hidden rounded-md border border-card-border bg-card">
        {loading ? (
          <div className="grid min-h-96 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : (
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
              {weekdays.map((day, index) => (
                <p key={day} className="border-r border-border/60 p-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground last:border-r-0">
                  {weekdayFormatter.format(new Date(2024, 0, index))}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayReservations = day ? reservationsByDay.get(day.toISOString().slice(0, 10)) ?? [] : [];
                const isToday = day ? sameDay(day, today) : false;
                const isWeekend = day ? day.getDay() === 0 || day.getDay() === 6 : false;
                return (
                  <div
                    key={day?.toISOString() ?? `empty-${index}`}
                    className={`group relative min-h-28 border-b border-r border-border/60 p-2 transition-colors last:border-r-0 sm:min-h-36 ${isWeekend ? 'bg-secondary/20' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between">
                          {isToday ? (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary font-2.5 text-[0.7rem] font-semibold text-primary-foreground">
                              {day.getDate()}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">{day.getDate()}</span>
                          )}
                          {dayReservations.length > 0 && (
                            <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                              {dayReservations.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayReservations.slice(0, 3).map((reservation) => {
                            const tone = statusTone[reservation.status ?? 'pending'] ?? statusTone.pending;
                            return (
                              <div
                                key={reservation._id}
                                className={`rounded-[3px] border px-1.5 py-1 text-[10px] leading-4 sm:text-[11px] ${tone}`}
                              >
                                <p className="truncate font-semibold">{labelOf(reservation.campsite, 'Campsite')}</p>
                                <p className="truncate opacity-80">{reservation.customer?.firstName} {reservation.customer?.lastName}</p>
                              </div>
                            );
                          })}
                          {dayReservations.length > 3 && (
                            <p className="px-1 text-[10px] font-medium text-muted-foreground">
                              +{dayReservations.length - 3} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-card px-5 py-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Legend</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Approved</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-secondary" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-destructive" /> Cancelled</span>
        <span className="ml-auto hidden text-muted-foreground/70 sm:inline">
          Today is <span className="font-medium text-foreground">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </span>
      </section>

      {reservations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Detail</p>
              <h2 className="display-3 mt-2">First arrivals this month</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {reservations.slice(0, 4).map((reservation) => (
              <Card key={reservation._id} className="rounded-md border border-card-border bg-card">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {String(reservation.checkIn).slice(0, 10)}
                    </p>
                    <OperationsStatusBadge status={reservation.status} />
                  </div>
                  <p className="font-serif text-lg leading-tight">{labelOf(reservation.campsite, 'Campsite')}</p>
                  <p className="text-xs text-muted-foreground">
                    {reservation.customer?.firstName} {reservation.customer?.lastName}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MonthStat({ label, value, detail, tone = 'default' }: {
  label: string; value: number; detail: string;
  tone?: 'default' | 'primary' | 'accent' | 'muted' | 'sand';
}) {
  const accent = {
    default: 'border-border',
    primary: 'border-primary/30 bg-primary/8',
    accent: 'border-accent/30 bg-accent/8',
    muted: 'border-border bg-secondary/40',
    sand: 'border-accent/20 bg-accent/5',
  }[tone];
  return (
    <div className={`rounded-md border ${accent} bg-card px-4 py-4`}>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}