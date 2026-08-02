import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { addUiNotification, apiError, createReservation, idOf, listCampgrounds, listCampsites, type ApiItem } from '@/services/customerDashboardService';

type Values = { campground: string; campsite: string; checkIn: string; checkOut: string; adults: number; children: number; vehicles: number; specialRequests: string };
export default function Reservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredCampground = searchParams.get('campground') ?? '';
  const preferredSite = searchParams.get('preferredSite') ?? '';
  const form = useForm<Values>({ defaultValues: { campground: '', campsite: '', checkIn: '', checkOut: '', adults: 2, children: 0, vehicles: 1, specialRequests: '' } });
  const [campgrounds, setCampgrounds] = useState<ApiItem[]>([]);
  const [sites, setSites] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedCampground = form.watch('campground');
  const selectedSiteId = form.watch('campsite');
  const checkIn = form.watch('checkIn');
  const checkOut = form.watch('checkOut');
  const selectedSite = sites.find((site) => idOf(site) === selectedSiteId);
  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return checkIn && checkOut && end > start ? Math.ceil((end.getTime() - start.getTime()) / 86400000) : 0;
  }, [checkIn, checkOut]);
  const total = nights * Number(selectedSite?.basePrice ?? 0);
  useEffect(() => {
    listCampgrounds()
      .then((campgroundsData) => {
        setCampgrounds(campgroundsData);
        if (preferredCampground && campgroundsData.some((campground) => String(campground._id ?? campground.id) === preferredCampground)) {
          form.setValue('campground', preferredCampground);
        }
      })
      .catch((caught) => setError(apiError(caught, 'We could not load campgrounds.')))
      .finally(() => setLoading(false));
  }, [form, preferredCampground]);

  useEffect(() => {
    if (!selectedCampground) {
      setSites([]);
      return;
    }

    form.setValue('campsite', '');
    setChecking(true);
    listCampsites(selectedCampground)
      .then((result) => {
        setSites(result);
        if (preferredSite && result.some((site) => String(site._id ?? site.id) === preferredSite)) {
          form.setValue('campsite', preferredSite);
        }
      })
      .catch((caught) => setError(apiError(caught, 'We could not check campsite availability.')))
      .finally(() => setChecking(false));
  }, [form, preferredCampground, preferredSite, selectedCampground]);
  const checkAvailability = async () => { if (!selectedCampground) { form.setError('campground', { message: 'Choose a campground first' }); return; } setChecking(true); try { setSites(await listCampsites(selectedCampground)); } catch (caught) { setError(apiError(caught, 'We could not check campsite availability.')); } finally { setChecking(false); } };
  const submit = async (values: Values) => { if (!selectedSite || !nights) { if (!nights) form.setError('checkOut', { message: 'Departure must be after arrival' }); return; } setError(null); try { const taxes = Math.round(total * 0.1 * 100) / 100; const reservation = await createReservation({ campground: values.campground, campsite: values.campsite, checkIn: values.checkIn, checkOut: values.checkOut, guests: { adults: Number(values.adults), children: Number(values.children), vehicles: Number(values.vehicles) }, specialRequests: values.specialRequests || undefined, pricing: { baseRate: Number(selectedSite.basePrice), nights, subtotal: total, taxes, fees: 0, discount: 0, total: total + taxes } }); addUiNotification({ type: 'booking_confirmation', title: 'Booking confirmed', message: `Your stay from ${values.checkIn} to ${values.checkOut} is confirmed.` }); navigate(`/reservation/confirmation/${idOf(reservation)}`, { replace: true }); } catch (caught) { setError(apiError(caught, 'We could not create your reservation.')); } };
  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;
  return <div className="mx-auto max-w-5xl space-y-8 pb-10"><section><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Plan your stay</p><h1 className="mt-3 font-serif text-5xl tracking-tight">Reserve your campsite.</h1><p className="mt-4 text-lg text-muted-foreground">Choose a campground, dates, and a currently available site.</p></section>{error && <ErrorState title="Reservation unavailable" message={error} />}<div className="grid gap-6 lg:grid-cols-[1fr_330px]"><Card><CardHeader><CardTitle className="font-serif text-3xl">Stay details</CardTitle></CardHeader><CardContent><Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5"><FormField control={form.control} name="campground" rules={{ required: 'Choose a campground' }} render={({ field }) => <FormItem><FormLabel>Campground</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Choose a location" /></SelectTrigger></FormControl><SelectContent>{campgrounds.map((campground) => <SelectItem key={idOf(campground)} value={idOf(campground)}>{campground.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} /><div className="grid gap-5 sm:grid-cols-2"><FormField control={form.control} name="checkIn" rules={{ required: 'Arrival date is required' }} render={({ field }) => <FormItem><FormLabel>Arrival</FormLabel><FormControl><Input type="date" min={new Date().toISOString().slice(0, 10)} {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="checkOut" rules={{ required: 'Departure date is required' }} render={({ field }) => <FormItem><FormLabel>Departure</FormLabel><FormControl><Input type="date" min={checkIn || new Date().toISOString().slice(0, 10)} {...field} /></FormControl><FormMessage /></FormItem>} /></div><div className="flex items-end gap-3"><FormField control={form.control} name="campsite" rules={{ required: 'Choose a campsite' }} render={({ field }) => <FormItem className="flex-1"><FormLabel>Campsite</FormLabel><Select value={field.value} onValueChange={field.onChange} disabled={!selectedCampground || checking}><FormControl><SelectTrigger><SelectValue placeholder={checking ? 'Checking sites…' : 'Choose an available site'} /></SelectTrigger></FormControl><SelectContent>{sites.map((site) => <SelectItem key={idOf(site)} value={idOf(site)}>{site.name ?? `Site ${site.siteNumber}`} · ${site.basePrice}/night</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} /><Button type="button" variant="outline" onClick={() => void checkAvailability()} disabled={checking}>{checking ? <Spinner /> : <CalendarDays />}Check</Button></div><div className="grid gap-5 sm:grid-cols-3">{(['adults', 'children', 'vehicles'] as const).map((name) => <FormField key={name} control={form.control} name={name} rules={{ min: { value: name === 'adults' ? 1 : 0, message: name === 'adults' ? 'At least 1 adult' : 'Cannot be negative' } }} render={({ field }) => <FormItem><FormLabel>{name[0].toUpperCase() + name.slice(1)}</FormLabel><FormControl><Input type="number" min={name === 'adults' ? 1 : 0} {...field} onChange={(event) => field.onChange(Number(event.target.value))} /></FormControl><FormMessage /></FormItem>} />)}</div><FormField control={form.control} name="specialRequests" render={({ field }) => <FormItem><FormLabel>Special requests <span className="font-normal text-muted-foreground">(optional)</span></FormLabel><FormControl><Input placeholder="Accessibility needs, arrival note…" {...field} /></FormControl><FormMessage /></FormItem>} /><Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Spinner />Booking…</> : 'Confirm reservation'}</Button></form></Form></CardContent></Card><Card className="h-fit"><CardContent className="p-6"><MapPin className="h-5 w-5 text-accent" /><h2 className="mt-4 font-serif text-2xl">Your stay</h2><p className="mt-3 text-sm text-muted-foreground">Current availability is checked from our campsite inventory. Date-specific conflict checking will be added when the backend exposes it.</p><div className="mt-6 space-y-3 border-t pt-5 text-sm"><div className="flex justify-between"><span>Selected site</span><span className="font-medium">{selectedSite?.name ?? '—'}</span></div><div className="flex justify-between"><span>Nights</span><span>{nights || '—'}</span></div><div className="flex justify-between text-lg font-semibold"><span>Estimated total</span><span>${(total * 1.1 || 0).toFixed(2)}</span></div></div></CardContent></Card></div></div>;
}
