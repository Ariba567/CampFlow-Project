import { useEffect, useState } from 'react';
import { Edit3, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import InvoiceDialog from '@/components/customer/InvoiceDialog';
import ReservationStatus from '@/components/customer/ReservationStatus';
import { addUiNotification, apiError, cancelReservation, idOf, labelOf, listReservations, updateReservation, type ApiItem } from '@/services/customerDashboardService';
import { toast } from 'sonner';

const dateOnly = (value: unknown) => String(value ?? '').slice(0, 10);
const nightsBetween = (checkIn: string, checkOut: string) => Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000);

export default function DashboardBookings() {
  const [reservations, setReservations] = useState<ApiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<ApiItem | null>(null);
  const [editDates, setEditDates] = useState({ checkIn: '', checkOut: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const load = () => { setLoading(true); listReservations().then((result) => setReservations(result.data)).catch((caught) => setError(apiError(caught, 'We could not load your bookings.'))).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openEdit = (reservation: ApiItem) => {
    setEdit(reservation);
    setEditDates({ checkIn: dateOnly(reservation.checkIn), checkOut: dateOnly(reservation.checkOut) });
    setEditError(null);
  };

  const cancel = async (reservation: ApiItem) => {
    if (!window.confirm('Cancel this reservation? It will remain in your booking history.')) return;
    try {
      await cancelReservation(idOf(reservation));
      addUiNotification({ type: 'booking_cancellation', title: 'Reservation cancelled', message: `Your reservation at ${labelOf(reservation.campground, 'Green Valley')} was cancelled.` });
      toast.success('Reservation cancelled');
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not cancel this reservation.'));
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

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;
  const upcoming = reservations.filter((item) => new Date(item.checkIn) >= new Date() && item.status !== 'cancelled');
  const history = reservations.filter((item) => !upcoming.includes(item));
  const canManage = (reservation: ApiItem) => new Date(reservation.checkIn) >= new Date() && reservation.status !== 'cancelled' && reservation.status !== 'completed';
  const group = (title: string, items: ApiItem[]) => <section><h2 className="font-serif text-3xl">{title}</h2>{items.length ? <div className="mt-5 grid gap-4">{items.map((reservation) => <Card key={idOf(reservation)}><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold">{labelOf(reservation.campground, 'Green Valley')}</h3><ReservationStatus status={reservation.status} /></div><p className="mt-2 text-sm text-muted-foreground">{dateOnly(reservation.checkIn)} — {dateOnly(reservation.checkOut)} · {labelOf(reservation.campsite, 'Campsite')}</p></div><div className="flex flex-wrap gap-2"><InvoiceDialog reservation={reservation} />{canManage(reservation) && <><Button variant="outline" size="sm" onClick={() => openEdit(reservation)}><Edit3 />Edit</Button><Button variant="outline" size="sm" onClick={() => void cancel(reservation)}><XCircle />Cancel</Button></>}</div></CardContent></Card>)}</div> : <Card className="mt-5"><CardContent className="p-8 text-center text-sm text-muted-foreground">No {title.toLowerCase()} yet.</CardContent></Card>}</section>;

  return <div className="space-y-10 pb-10"><section><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Your stays</p><h1 className="mt-3 font-serif text-5xl tracking-tight">Bookings</h1></section>{error && <ErrorState title="Bookings unavailable" message={error} />}{group('Upcoming reservations', upcoming)}{group('Booking history', history)}<Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}><DialogContent><DialogHeader><DialogTitle>Edit reservation dates</DialogTitle></DialogHeader>{edit && <form className="space-y-5" onSubmit={saveEdit}><div className="space-y-2"><Label htmlFor="edit-in">Arrival</Label><Input id="edit-in" name="checkIn" type="date" value={editDates.checkIn} onChange={(event) => { setEditDates((value) => ({ ...value, checkIn: event.target.value })); setEditError(null); }} required /></div><div className="space-y-2"><Label htmlFor="edit-out">Departure</Label><Input id="edit-out" name="checkOut" type="date" min={editDates.checkIn} value={editDates.checkOut} onChange={(event) => { setEditDates((value) => ({ ...value, checkOut: event.target.value })); setEditError(null); }} required /></div>{revisedNights > 0 && <div className="rounded-xl bg-secondary p-4 text-sm"><div className="flex justify-between"><span>{revisedNights} night{revisedNights === 1 ? '' : 's'}</span><span className="font-semibold">${revisedTotal.toFixed(2)}</span></div><p className="mt-1 text-muted-foreground">Updated total, including taxes and stored fees.</p></div>}{editError && <p className="text-sm text-destructive">{editError}</p>}<Button type="submit" disabled={revisedNights <= 0}>Save changes</Button></form>}</DialogContent></Dialog></div>;
}
