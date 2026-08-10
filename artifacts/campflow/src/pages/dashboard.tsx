import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CreditCard, Heart, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import ReservationStatus from '@/components/customer/ReservationStatus';
import ReviewForm from '@/components/reviews/ReviewForm';
import { addUiNotification, apiError, deleteReview, idOf, labelOf, listCustomerReviews, listFavorites, listPayments, listReservations, listUiNotifications, type ApiItem, type UiNotification } from '@/services/customerDashboardService';
import { toast } from 'sonner';

export default function Dashboard() {
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
        setData({ reservations: reservations.data, favorites: favorites.data, payments: payments.data, reviews: reviewsResult.data });
        setNotifications(listUiNotifications());
      })
      .catch((caught) => setError(apiError(caught, 'We could not load your dashboard.')));
  }, []);

  if (error) return <ErrorState title="Dashboard unavailable" message={error} />;
  if (!data) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;

  const upcoming = data.reservations.filter((item) => new Date(item.checkIn) >= new Date() && item.status !== 'cancelled');
  const history = data.reservations.filter((item) => new Date(item.checkOut) < new Date() || item.status === 'cancelled');

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

  return (
    <div className="space-y-10 pb-10">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Your Green Valley</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Welcome back.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Keep your favorite places and upcoming escapes close.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Upcoming stays', value: upcoming.length, icon: CalendarDays },
          { label: 'Past stays', value: history.length, icon: MapPin },
          { label: 'Favorites', value: data.favorites.length, icon: Heart },
          { label: 'Payment records', value: data.payments.length, icon: CreditCard },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <Icon className="h-5 w-5 text-accent" />
              <p className="mt-4 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Upcoming reservations</h2>
              <Button asChild variant="link" size="sm">
                <Link to="/dashboard/bookings">See all</Link>
              </Button>
            </div>
            {upcoming.length ? (
              <div className="mt-5 space-y-3">
                {upcoming.slice(0, 3).map((reservation) => (
                  <div key={reservation._id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{labelOf(reservation.campground, 'Green Valley')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{String(reservation.checkIn).slice(0, 10)} — {String(reservation.checkOut).slice(0, 10)}</p>
                      </div>
                      <ReservationStatus status={reservation.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed p-7 text-center">
                <p className="font-medium">No reservations yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Start exploring campgrounds for your next escape.</p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/campgrounds">Explore campgrounds</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl">Notifications</h2>
            </div>
            {notifications.length ? (
              <div className="mt-5 space-y-4">
                {notifications.slice(0, 3).map((note) => (
                  <div key={note.id} className="border-b pb-4 last:border-0">
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{note.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Booking, cancellation, and payment confirmations will appear here when available.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Favorite campsites</h2>
            {data.favorites.length ? (
              <div className="mt-4 space-y-2">
                {data.favorites.slice(0, 4).map((site) => (
                  <p key={site._id} className="text-sm">{site.name ?? `Site ${site.siteNumber}`}</p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No favorite campsites yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Saved payment methods</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Saved cards are a UI-only placeholder until secure payment-method storage is available.</p>
            <div className="mt-4 rounded-xl bg-secondary p-4 text-sm font-medium">Visa •••• 4242 <span className="ml-2 text-muted-foreground">Demo only</span></div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Payment history</h2>
            {data.payments.length ? (
              <div className="mt-5 space-y-3">
                {data.payments.map((payment) => (
                  <div key={idOf(payment)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm">
                    <div>
                      <p className="font-semibold">${Number(payment.amount ?? 0).toFixed(2)} · {String(payment.method ?? 'payment').replace('_', ' ')}</p>
                      <p className="mt-1 text-muted-foreground">{String(payment.paidAt ?? payment.createdAt ?? '').slice(0, 10)} · {payment.transactionId ?? 'Payment record'}</p>
                    </div>
                    <span className="capitalize text-muted-foreground">{String(payment.status ?? 'pending').replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No payment records yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl">Your reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">Reviews you've written for Green Valley campgrounds.</p>
        </div>
        {data.reviews.length ? (
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <Card key={idOf(review)}>
                <CardContent className="p-6">
                  {editingId === idOf(review) ? (
                     <ReviewForm
                       campgroundId={idOf(review.campground)}
                       reservationId={idOf(review.reservationId)}
                       existingReview={review}
                       onSubmitted={handleReviewSubmitted}
                     />
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-accent">
                            {Array.from({ length: Number(review.rating ?? 0) }, (_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <span className="font-semibold">{labelOf(review.campground, 'Green Valley')}</span>
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {String(review.createdAt ?? '').slice(0, 10)}
                        </time>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(idOf(review))}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
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
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No reviews yet. Share your stay from a campground page.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
