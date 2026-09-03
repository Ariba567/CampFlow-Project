import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Check, Compass, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import InvoiceDialog from '@/components/customer/InvoiceDialog';
import { apiError, getReservation, idOf, labelOf, type ApiItem } from '@/services/customerDashboardService';

const nextSteps = [
  {
    icon: CalendarCheck,
    title: 'Add to your calendar',
    description: 'Block off your stay so the dates are yours. We’ll send a reminder a day before arrival.',
  },
  {
    icon: Compass,
    title: 'Arrive any time after 3pm',
    description: 'Check-in opens at 3pm. Late arrivals? The host office is staffed until 9pm — just give a heads-up.',
  },
  {
    icon: MapPin,
    title: 'Show your reservation on arrival',
    description: 'Have your reservation number ready at the gate or visitor center. You’ll be greeted and shown to your site.',
  },
];

export default function ReservationConfirmation() {
  const { id } = useParams();
  const [reservation, setReservation] = useState<ApiItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getReservation(id)
      .then(setReservation)
      .catch((caught) => setError(apiError(caught, 'We could not load this reservation.')));
  }, [id]);

  const campgroundName = useMemo(
    () => labelOf(reservation?.campground, 'your campground'),
    [reservation],
  );
  const siteName = useMemo(() => labelOf(reservation?.campsite, 'your site'), [reservation]);
  const reservationNumber = String(reservation?.reservationNumber ?? id?.slice(-6) ?? '—');
  const total = Number(reservation?.pricing?.total ?? 0);
  const subtotal = Number(reservation?.pricing?.subtotal ?? total);
  const taxes = Number(reservation?.pricing?.taxes ?? 0);
  const fees = Number(reservation?.pricing?.fees ?? 0);
  const baseRate = Number(reservation?.pricing?.baseRate ?? 0);
  const nights = Number(reservation?.pricing?.nights ?? 0);
  const guests = reservation?.guests as
    | { adults?: number; children?: number; vehicles?: number }
    | undefined;
  const totalGuests = Number(guests?.adults ?? 0) + Number(guests?.children ?? 0);

  if (error) return <ErrorState title="Confirmation unavailable" message={error} />;
  if (!reservation) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  return (
    <div className="container-page space-y-12 pb-16">
      <section className="relative overflow-hidden border border-border bg-card">
        <div className="relative grid gap-8 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:px-12 md:py-20">
          <div>
            <p className="eyebrow inline-flex items-center gap-2 bg-secondary px-3 py-1.5 text-primary">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Reservation confirmed
            </p>
            <h1 className="display-1 mt-5 text-primary">Your stay is booked.</h1>
            <p className="lede mt-5 max-w-xl text-foreground">
              {formatDateRange(String(reservation.checkIn).slice(0, 10), String(reservation.checkOut).slice(0, 10))} at {campgroundName}.
              Pack the marshmallows — we’ll see you outside.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <InvoiceDialog reservation={reservation} />
              <Button asChild variant="outline" className="border-border bg-card">
                <Link to="/dashboard/bookings">View my bookings</Link>
              </Button>
            </div>
          </div>

          <div className="border border-border bg-background p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Reservation</p>
            <p className="mt-2 font-serif text-4xl text-foreground">#{reservationNumber}</p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="font-medium text-foreground">Confirmed</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatRelative(reservation.createdAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="border border-border bg-card">
          <header className="flex items-baseline justify-between border-b border-border px-6 py-5 md:px-8">
            <h2 className="font-serif text-2xl text-foreground">The essentials</h2>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Booking summary</p>
          </header>

          <dl className="divide-y divide-border text-sm">
            <SummaryRow label="Campground" value={campgroundName} />
            <SummaryRow label="Site" value={siteName} />
            <SummaryRow
              label="Arrival"
              value={formatDate(String(reservation.checkIn).slice(0, 10))}
            />
            <SummaryRow
              label="Departure"
              value={formatDate(String(reservation.checkOut).slice(0, 10))}
            />
            <SummaryRow
              label="Stay length"
              value={nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : '—'}
            />
            <SummaryRow
              label="Guests"
              value={
                totalGuests
                  ? `${totalGuests} guest${totalGuests === 1 ? '' : 's'}${
                      guests?.vehicles ? ` · ${guests.vehicles} vehicle${guests.vehicles === 1 ? '' : 's'}` : ''
                    }`
                  : '—'
              }
            />
          </dl>

          <div className="border-t border-border bg-secondary/40 px-6 py-5 md:px-8">
            <p className="eyebrow text-muted-foreground">Price breakdown</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              {nights > 0 && baseRate > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    ${baseRate.toFixed(2)} <span className="text-muted-foreground/70">×</span> {nights} night{nights === 1 ? '' : 's'}
                  </dt>
                  <dd className="font-medium tabular-nums">${subtotal.toFixed(2)}</dd>
                </div>
              )}
              {fees > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cleaning & service fee</dt>
                  <dd className="font-medium tabular-nums">${fees.toFixed(2)}</dd>
                </div>
              )}
              {taxes > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Taxes</dt>
                  <dd className="font-medium tabular-nums">${taxes.toFixed(2)}</dd>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-border pt-4">
                <dt className="font-serif text-base text-foreground">Total charged</dt>
                <dd className="font-serif text-3xl text-primary tabular-nums">${total.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-border px-6 py-5 md:px-8">
            <p className="text-sm leading-6 text-muted-foreground">
              We’ve added a booking confirmation and a payment receipt to your in-app notifications. Look for them under your dashboard.
            </p>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div>
            <p className="eyebrow">What’s next</p>
            <ol className="mt-4 space-y-3">
              {nextSteps.map(({ icon: Icon, title, description }, index) => (
                <li
                  key={title}
                  className="grid grid-cols-[auto_1fr] items-start gap-4 border border-border bg-card p-5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center border border-primary bg-primary text-[12px] font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 font-serif text-base text-primary">
                      <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                      {title}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Button
            asChild
            className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            <Link to={`/campgrounds/${idOf(reservation.campground)}`}>
              Explore {campgroundName} <ArrowRight />
            </Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 md:px-8">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return '';
  return `${formatDate(checkIn)} – ${formatDate(checkOut)}`;
}

function formatRelative(value: unknown) {
  if (!value) return 'Just now';
  try {
    const date = new Date(String(value));
    const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
    if (Number.isNaN(diffMin)) return 'Just now';
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}