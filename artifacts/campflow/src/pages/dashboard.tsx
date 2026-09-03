import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bell, CalendarDays, CheckCircle, Clock, CreditCard, Heart, MapPin, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import ReservationStatus from '@/components/customer/ReservationStatus';
import ReviewForm from '@/components/reviews/ReviewForm';
import { addUiNotification, apiError, deleteReview, idOf, labelOf, listCustomerReviews, listFavorites, listPayments, listReservations, listUiNotifications, type ApiItem, type UiNotification } from '@/services/customerDashboardService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<{ reservations: ApiItem[]; favorites: ApiItem[]; payments: ApiItem[]; reviews: ApiItem[] } | null>(null);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listReservations(), listFavorites(), listPayments(), listCustomerReviews()])
      .then(([reservations, favorites, payments, reviewsResult]) => {
        payments.data
          .filter((payment) => payment.status === 'completed')
          .forEach((payment) => addUiNotification({
            type: 'payment_confirmation',
            title: 'Payment confirmed',
            message: `Your payment of $${Number(payment.amount ?? 0).toFixed(2)} was confirmed.`,
            dedupeKey: `payment-confirmation:${idOf(payment)}`,
          }));
        reservations.data
          .filter((r) => r.status !== 'cancelled' && new Date(r.checkIn) > new Date())
          .forEach((r) => {
            const diffDays = Math.ceil((new Date(r.checkIn).getTime() - Date.now()) / 86400000);
            if (diffDays <= 3) {
              addUiNotification({
                type: 'reminder',
                title: 'Upcoming stay',
                message: `Your stay at ${labelOf(r.campground, 'Green Valley')} starts in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
                dedupeKey: `reservation-reminder:${idOf(r)}`,
              });
            }
          });
        setData({ reservations: reservations.data, favorites: favorites.data, payments: payments.data, reviews: reviewsResult.data });
        setNotifications(listUiNotifications());
      })
      .catch((caught) => setError(apiError(caught, 'We could not load your dashboard.')));
  }, []);

  if (error) return <ErrorState title="Dashboard unavailable" message={error} />;
  if (!data) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;

  const upcoming = data.reservations.filter((item) => item.status === 'pending' || item.status === 'confirmed');
  const history = data.reservations.filter((item) => item.status === 'completed' || item.status === 'cancelled');
  const recentPast = history.filter((item) => item.status === 'completed').slice(0, 3);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      setData((prev) => prev ? { ...prev, reviews: prev.reviews.filter((r) => idOf(r) !== reviewId) } : prev);
      toast.success('Review deleted.');
    } catch (caught) {
      toast.error(apiError(caught, 'Could not delete review.'));
    }
  };

  const handleReviewSubmitted = () => {
    setEditingId(null);
    listCustomerReviews()
      .then((result) => setData((prev) => prev ? { ...prev, reviews: result.data } : prev))
      .catch(() => {});
  };

  const greetingName = user?.firstName ? `, ${user.firstName}` : '';
  const kpis = [
    { n: '01', label: 'Upcoming stays', value: upcoming.length, icon: CalendarDays },
    { n: '02', label: 'Past stays', value: history.length, icon: MapPin },
    { n: '03', label: 'Favorites', value: data.favorites.length, icon: Heart },
    { n: '04', label: 'Payment records', value: data.payments.length, icon: CreditCard },
  ];

  return (
    <div className="container-page space-y-16 pb-16">
      <section className="relative overflow-hidden border-b border-border/60 pb-12">
        <div className="grid items-end gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow">Your Green Valley</p>
            <h1 className="display-1 mt-5">Welcome back{greetingName}.</h1>
            <p className="lede mt-6 max-w-xl">
              A quiet corner of your account &mdash; upcoming escapes, recent stays, the places
              you keep coming back to. Everything you need to plan the next one without
              losing track of the last.
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-start gap-3 md:justify-end">
            <Button asChild variant="outline" className="border-primary/30 bg-transparent">
              <Link to="/dashboard/bookings">View all bookings</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/campgrounds">Plan a new stay <ArrowUpRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
          <p className="eyebrow">At a glance</p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated just now</p>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-y divide-border border border-border md:grid-cols-4 md:divide-y-0">
          {kpis.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-6 bg-card p-6 md:p-7">
              <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <div>
                <dd className="font-serif text-4xl tracking-[-0.02em]">{value}</dd>
                <dt className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
            <h2 className="font-serif text-2xl">Upcoming reservations</h2>
            <Button asChild variant="link" size="sm" className="text-primary">
              <Link to="/dashboard/bookings">See all <ArrowUpRight /></Link>
            </Button>
          </div>
          {upcoming.length ? (
            <div className="space-y-4">
              {upcoming.slice(0, 3).map((reservation) => {
                const siteName = labelOf(reservation.campsite, 'Campsite');
                const total = Number(reservation.pricing?.total ?? 0);
                const nights = Number(reservation.pricing?.nights ?? 0);
                const rsvNumber = String(reservation.reservationNumber ?? '').slice(-6);
                return (
                  <article key={reservation._id} className="border border-border bg-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-xl text-foreground">{labelOf(reservation.campground, 'Campground')}</p>
                        <p className="mt-1 text-sm text-foreground">{siteName}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {rsvNumber ? `#${rsvNumber}` : ''}
                        </p>
                      </div>
                      <ReservationStatus status={reservation.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Check-in</dt>
                        <dd className="mt-0.5 font-medium text-foreground">{String(reservation.checkIn).slice(0, 10)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Check-out</dt>
                        <dd className="mt-0.5 font-medium text-foreground">{String(reservation.checkOut).slice(0, 10)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Nights</dt>
                        <dd className="mt-0.5 font-medium text-foreground">{nights || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</dt>
                        <dd className="mt-0.5 font-serif text-base text-foreground">${total.toFixed(2)}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex items-center justify-end gap-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/dashboard/bookings">Manage booking</Link>
                      </Button>
                      <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link to={`/reservation/confirmation/${reservation._id}`}>View confirmation</Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="font-serif text-xl">No reservations yet</p>
              <p className="lede mt-2">Start exploring campgrounds for your next escape.</p>
              <Button asChild className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/campgrounds">Explore campgrounds</Link>
              </Button>
            </div>
          )}
        </div>

        <aside className="border-l border-border/60 pl-10">
          <p className="eyebrow">Field notes</p>
          <h2 className="display-3 mt-3 flex items-center gap-3">
            <Bell className="h-5 w-5 text-accent" /> Notifications
          </h2>
          {notifications.length ? (
            <ul className="mt-8 space-y-6">
              {notifications.slice(0, 3).map((note) => (
                <li key={note.id} className="border-b border-border/60 pb-6 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0">
                      {note.type === 'booking_confirmation' && <CheckCircle className="h-4 w-4 text-primary" />}
                      {note.type === 'booking_cancellation' && <XCircle className="h-4 w-4 text-destructive" />}
                      {note.type === 'payment_confirmation' && <CreditCard className="h-4 w-4 text-primary" />}
                      {note.type === 'reminder' && <Clock className="h-4 w-4 text-accent" />}
                    </span>
                    <div>
                      <p className="font-serif text-lg leading-tight">{note.title}</p>
                      <p className="lede mt-2 text-sm">{note.message}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lede mt-6">
              Booking, cancellation, payment confirmations, and stay reminders will appear
              here as they happen.
            </p>
          )}
        </aside>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
          <h2 className="font-serif text-2xl">Recent past stays</h2>
          <Button asChild variant="link" size="sm" className="text-primary">
            <Link to="/dashboard/bookings">All bookings <ArrowUpRight /></Link>
          </Button>
        </div>
        {recentPast.length ? (
          <div className="mt-6 overflow-x-auto border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-medium">Campground</th>
                  <th className="px-5 py-4 font-medium">Dates</th>
                  <th className="px-5 py-4 font-medium text-right">Total</th>
                  <th className="px-5 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentPast.map((reservation) => (
                  <tr key={reservation._id} className="bg-card">
                    <td className="px-5 py-4">
                      <p className="font-serif text-base text-foreground">{labelOf(reservation.campground, 'Campground')}</p>
                      <p className="text-xs text-muted-foreground">{labelOf(reservation.campsite, 'Campsite')}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {String(reservation.checkIn).slice(0, 10)} — {String(reservation.checkOut).slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-foreground">
                      ${Number(reservation.pricing?.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ReservationStatus status={reservation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lede">No completed stays yet. The first one is the one you tell stories about.</p>
        )}
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">Favorite campsites</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Pinned by you</p>
          </div>
          {data.favorites.length ? (
            <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
              {data.favorites.slice(0, 4).map((site) => (
                <li key={site._id} className="flex items-baseline justify-between py-4 text-base">
                  <span className="font-serif text-lg">{site.name ?? `Site ${site.siteNumber}`}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lede mt-4">No favorite campsites yet. Tap the heart on a site to keep it close.</p>
          )}
        </div>
        <div>
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">Payment method</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">On file</p>
          </div>
          <div className="mt-6 border border-border/60 bg-card p-6">
            <p className="lede text-sm">
              Saved cards are a UI-only placeholder until secure payment-method storage is available.
            </p>
            <p className="mt-4 font-serif text-lg">Visa <span className="text-muted-foreground">&middot;&middot;&middot;&middot; 4242</span></p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Demo only</p>
          </div>
        </div>
      </section>

      <section>
        <div className="border-b border-border pb-4">
          <h2 className="font-serif text-2xl">Payment history</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">The receipts</p>
        </div>
        {data.payments.length ? (
          <div className="mt-6 overflow-hidden border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Method</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Reference</th>
                  <th className="px-5 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.payments.map((payment) => (
                  <tr key={idOf(payment)} className="bg-card">
                    <td className="px-5 py-4 font-serif text-base">${Number(payment.amount ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{String(payment.method ?? 'payment').replace('_', ' ')}</td>
                    <td className="px-5 py-4 text-muted-foreground">{String(payment.paidAt ?? payment.createdAt ?? '').slice(0, 10)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{payment.transactionId ?? 'Payment record'}</td>
                    <td className="px-5 py-4 text-right capitalize text-muted-foreground">{String(payment.status ?? 'pending').replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lede mt-4">No payment records yet.</p>
        )}
      </section>

      <section className="border-t border-border/60 pt-16">
        <div className="mb-8 border-b border-border pb-4">
          <h2 className="font-serif text-2xl">Your reviews</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">In your own words</p>
        </div>
        {data.reviews.length ? (
          <div className="space-y-6">
            {data.reviews.map((review) => (
              <Card key={idOf(review)}>
                <CardContent className="p-6 md:p-8">
                  {editingId === idOf(review) ? (
                    <ReviewForm
                      campgroundId={idOf(review.campground)}
                      reservationId={idOf(review.reservationId)}
                      existingReview={review}
                      onSubmitted={handleReviewSubmitted}
                    />
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-accent">
                            {Array.from({ length: Number(review.rating ?? 0) }, (_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <p className="mt-2 font-serif text-xl">{labelOf(review.campground, 'Green Valley')}</p>
                        </div>
                        <time className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {String(review.createdAt ?? '').slice(0, 10)}
                        </time>
                      </div>
                      <p className="lede mt-4 text-base">{review.comment}</p>
                      <div className="mt-6 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(idOf(review))}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => void handleDeleteReview(idOf(review))}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="font-serif text-xl">No reviews yet</p>
              <p className="lede mt-2">Share your stay from a campground page when you&rsquo;re ready.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}