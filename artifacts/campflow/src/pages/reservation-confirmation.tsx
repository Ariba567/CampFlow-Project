import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Compass, MapPin, Sparkles, TentTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import InvoiceDialog from '@/components/customer/InvoiceDialog';
import { apiError, getReservation, idOf, labelOf, type ApiItem } from '@/services/customerDashboardService';

const nextSteps = [
  {
    icon: CalendarCheck,
    title: 'Add to your calendar',
    description: 'Block off your stay so the dates are yours. We\'ll send a reminder a day before arrival.',
  },
  {
    icon: Compass,
    title: 'Arrive any time after 3pm',
    description: 'Check-in opens at 3pm. Late arrivals? The host office is staffed until 9pm — just give a heads-up.',
  },
  {
    icon: MapPin,
    title: 'Show your reservation on arrival',
    description: 'Have your reservation number ready at the gate or visitor center. You\'ll be greeted and shown to your site.',
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
    [reservation]
  );
  const siteName = useMemo(() => labelOf(reservation?.campsite, 'your site'), [reservation]);
  const reservationNumber = String(
    reservation?.reservationNumber ?? id?.slice(-6) ?? '—'
  );
  const total = Number(reservation?.pricing?.total ?? 0);
  const guests = reservation?.guests as { adults?: number; children?: number; vehicles?: number } | undefined;
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
      <section className="relative overflow-hidden rounded-3xl border border-card-border bg-card">
          <img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1800&q=70"
            alt="Tent glowing at dusk in the forest"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="relative px-6 py-16 md:px-12 md:py-24">
            <div className="max-w-3xl">
              <p className="eyebrow inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Reservation confirmed
              </p>
              <h1 className="display-1 mt-6 text-primary">Your stay is booked.</h1>
              <p className="lede mt-6 max-w-2xl text-foreground">
                {formatDateRange(String(reservation.checkIn).slice(0, 10), String(reservation.checkOut).slice(0, 10))} at {campgroundName}.
                Pack the marshmallows — we'll see you outside.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <InvoiceDialog reservation={reservation} />
                <Button asChild variant="outline">
                  <Link to="/dashboard/bookings">View my bookings</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="border-card-border bg-card">
          <CardContent className="space-y-6 p-6 md:p-10">
            <header className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <TentTree className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">Reservation summary</p>
                <h2 className="display-3 text-primary">The essentials</h2>
              </div>
            </header>

            <dl className="divide-y divide-card-border text-sm">
              <SummaryRow label="Reservation number" value={`#${reservationNumber}`} accent />
              <SummaryRow label="Campground" value={campgroundName} />
              <SummaryRow label="Site" value={siteName} />
              <SummaryRow label="Arrival" value={formatDate(String(reservation.checkIn).slice(0, 10))} />
              <SummaryRow label="Departure" value={formatDate(String(reservation.checkOut).slice(0, 10))} />
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
              <SummaryRow label="Total paid" value={`$${total.toFixed(2)}`} bold />
            </dl>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-7 text-foreground">
              We've added a booking confirmation and a payment receipt to your in-app notifications. Look for them under your dashboard.
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <p className="eyebrow">What's next</p>
          <ol className="space-y-4">
            {nextSteps.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-card-border bg-card p-5 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 font-serif text-lg text-primary">
                    <Icon className="h-4 w-4 text-accent" />
                    {title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
            <Link to={`/campgrounds/${idOf(reservation.campground)}`}>
              Explore {campgroundName} <ArrowRight />
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right ${accent ? 'font-serif text-xl text-primary' : ''} ${
          bold ? 'font-serif text-2xl text-primary' : 'font-medium text-foreground'
        }`}
      >
        {value}
      </dd>
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