import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Edit3, MapPin, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import InvoiceDialog from '@/components/customer/InvoiceDialog';
import Modal from '@/components/ui/modal';
import ReservationStatus from '@/components/customer/ReservationStatus';
import ReviewForm from '@/components/reviews/ReviewForm';
import { addUiNotification, apiError, cancelReservation, idOf, labelOf, listCustomerReviews, listReservations, updateReservation, type ApiItem } from '@/services/customerDashboardService';
import { toast } from 'sonner';

const dateOnly = (value: unknown) => String(value ?? '').slice(0, 10);
const nightsBetween = (checkIn: string, checkOut: string) => Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000);

export default function DashboardBookings() {
  const [reservations, setReservations] = useState<ApiItem[]>([]);
  const [reviews, setReviews] = useState<ApiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<ApiItem | null>(null);
  const [editDates, setEditDates] = useState({ checkIn: '', checkOut: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [cancelModalReservation, setCancelModalReservation] = useState<ApiItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reviewReservation, setReviewReservation] = useState<ApiItem | null>(null);
  const load = () => {
    setLoading(true);
    Promise.all([listReservations(), listCustomerReviews()])
      .then(([reservationResult, reviewResult]) => {
        setReservations(reservationResult.data);
        setReviews(reviewResult.data);
      })
      .catch((caught) => setError(apiError(caught, 'We could not load your bookings.')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openEdit = (reservation: ApiItem) => {
    setEdit(reservation);
    setEditDates({ checkIn: dateOnly(reservation.checkIn), checkOut: dateOnly(reservation.checkOut) });
    setEditError(null);
  };

  const requestCancel = (reservation: ApiItem) => {
    setCancelModalReservation(reservation);
  };

  const confirmCancel = async () => {
    if (!cancelModalReservation) return;

    setIsCancelling(true);
    try {
      await cancelReservation(idOf(cancelModalReservation));
      addUiNotification({ type: 'booking_cancellation', title: 'Reservation cancelled', message: `Your reservation at ${labelOf(cancelModalReservation.campground, 'Green Valley')} was cancelled.` });
      toast.success('Reservation cancelled');
      load();
      setCancelModalReservation(null);
    } catch (caught) {
      setError(apiError(caught, 'We could not cancel this reservation.'));
    } finally {
      setIsCancelling(false);
    }
  };

  const revisedNights = nightsBetween(editDates.checkIn, editDates.checkOut);
  const existingNights = edit ? Number(edit.pricing?.nights ?? nightsBetween(dateOnly(edit.checkIn), dateOnly(edit.checkOut))) : 0;
  const existingSubtotal = edit ? Number(edit.pricing?.subtotal ?? 0) : 0;
  const baseRate = edit ? Number(edit.pricing?.baseRate ?? (existingNights > 0 ? existingSubtotal / existingNights : 0)) : 0;
  const fees = edit ? Number(edit.pricing?.fees ?? 0) : 0;
  const discount = edit ? Number(edit.pricing?.discount ?? 0) : 0;
  const taxRate = edit && existingSubtotal > 0 ? Number(edit.pricing?.taxes ?? 0) / existingSubtotal : 0.1;
  const subtotal = Math.max(revisedNights, 0) * baseRate;
  const taxes = Math.round(subtotal * taxRate * 100) / 100;
  const revisedTotal = subtotal + taxes + fees - discount;

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edit) return;
    if (!editDates.checkIn || !editDates.checkOut || revisedNights <= 0) {
      setEditError('Departure must be after arrival.');
      return;
    }
    try {
      await updateReservation(idOf(edit), {
        checkIn: editDates.checkIn,
        checkOut: editDates.checkOut,
        guests: edit.guests,
        pricing: { baseRate, nights: revisedNights, subtotal, taxes, fees, discount, total: revisedTotal },
      });
      setEdit(null);
      setEditError(null);
      toast.success('Reservation updated');
      load();
    } catch (caught) {
      setEditError(apiError(caught, 'We could not update this reservation.'));
    }
  };

  const reviewFor = (reservation: ApiItem) => reviews.find((review) => idOf(review.campground) === idOf(reservation.campground));

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;
  const upcoming = reservations.filter((item) => item.status === 'pending' || item.status === 'confirmed');
  const completed = reservations.filter((item) => item.status === 'completed');
  const cancelled = reservations.filter((item) => item.status === 'cancelled');
  const canManage = (reservation: ApiItem) => new Date(reservation.checkIn) >= new Date() && reservation.status !== 'cancelled' && reservation.status !== 'completed';

  const group = (eyebrowText: string, title: string, items: ApiItem[]) => (
    <section>
      <div className="mb-8 flex items-baseline justify-between gap-6">
        <div>
          <p className="eyebrow">{eyebrowText}</p>
          <h2 className="display-3 mt-3">{title}</h2>
        </div>
        <span className="font-serif text-3xl text-muted-foreground/70">
          {String(items.length).padStart(2, '0')}
        </span>
      </div>
      {items.length ? (
        <div className="space-y-px bg-border">
          {items.map((reservation) => {
            const existingReview = reviewFor(reservation);
            return (
              <article
                key={idOf(reservation)}
                className="flex flex-col gap-6 bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-2xl">{labelOf(reservation.campground, 'Green Valley')}</h3>
                    <ReservationStatus status={reservation.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-accent" />
                      {dateOnly(reservation.checkIn)} &mdash; {dateOnly(reservation.checkOut)}
                    </span>
                    <span className="hidden h-3 w-px bg-border md:inline-block" />
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      {labelOf(reservation.campsite, 'Campsite')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <InvoiceDialog reservation={reservation} />
                  {reservation.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewReservation(reservation)}
                      className="border-primary/30"
                    >
                      <Star />{existingReview ? 'Edit your review' : 'Leave a review'}
                    </Button>
                  )}
                  {canManage(reservation) && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(reservation)}>
                        <Edit3 />Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => requestCancel(reservation)}
                      >
                        <XCircle />Cancel
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="lede border-l-2 border-accent pl-5">
          No {title.toLowerCase()} yet &mdash; once you book or complete a stay, it&rsquo;ll show up here.
        </p>
      )}
    </section>
  );

  return (
    <div className="container-page space-y-20 pb-16">
      <section className="border-b border-border/60 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Your stays</p>
            <h1 className="display-1 mt-5">Bookings</h1>
            <p className="lede mt-5 max-w-xl">
              Every reservation, every past night, every cancelled plan. Update dates,
              cancel a booking, or leave a review for a stay that&rsquo;s already wrapped.
            </p>
          </div>
          <Button asChild variant="outline" className="border-primary/30 bg-transparent">
            <a href="/reservation">Plan a new stay <ArrowUpRight /></a>
          </Button>
        </div>
      </section>

      {error && <ErrorState title="Bookings unavailable" message={error} />}
      {group('On the calendar', 'Upcoming reservations', upcoming)}
      {group('Memories', 'Completed stays', completed)}
      {group('No longer happening', 'Cancelled', cancelled)}

      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit reservation dates</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-5" onSubmit={saveEdit}>
              <div className="space-y-2">
                <Label htmlFor="edit-in">Arrival</Label>
                <Input
                  id="edit-in"
                  name="checkIn"
                  type="date"
                  value={editDates.checkIn}
                  onChange={(event) => {
                    setEditDates((value) => ({ ...value, checkIn: event.target.value }));
                    setEditError(null);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-out">Departure</Label>
                <Input
                  id="edit-out"
                  name="checkOut"
                  type="date"
                  min={editDates.checkIn}
                  value={editDates.checkOut}
                  onChange={(event) => {
                    setEditDates((value) => ({ ...value, checkOut: event.target.value }));
                    setEditError(null);
                  }}
                  required
                />
              </div>
              {revisedNights > 0 && (
                <div className="border-l-2 border-accent bg-secondary/40 p-4 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg">
                      {revisedNights} night{revisedNights === 1 ? '' : 's'}
                    </span>
                    <span className="font-serif text-lg">${revisedTotal.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">Updated total, including taxes and stored fees.</p>
                </div>
              )}
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <Button type="submit" disabled={revisedNights <= 0} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewReservation} onOpenChange={(open) => !open && setReviewReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {reviewReservation ? (reviewFor(reviewReservation) ? 'Edit your review' : 'Leave a review') : ''}
            </DialogTitle>
          </DialogHeader>
          {reviewReservation && (
            <ReviewForm
              campgroundId={idOf(reviewReservation.campground)}
              reservationId={idOf(reviewReservation)}
              existingReview={reviewFor(reviewReservation)}
              onSubmitted={() => { setReviewReservation(null); load(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Modal
        title="Cancel reservation?"
        description="Cancel this reservation? It will remain in your booking history."
        open={!!cancelModalReservation}
        onOpenChange={(open) => {
          if (!open) setCancelModalReservation(null);
        }}
        onConfirm={confirmCancel}
        confirmLabel={isCancelling ? 'Cancelling...' : 'Cancel reservation'}
        cancelLabel="Keep reservation"
      >
        <p className="lede">
          {cancelModalReservation
            ? `Your reservation at ${labelOf(cancelModalReservation.campground, 'Green Valley')} will remain in your booking history after cancellation.`
            : 'Confirm cancellation of the selected reservation.'}
        </p>
      </Modal>
    </div>
  );
}