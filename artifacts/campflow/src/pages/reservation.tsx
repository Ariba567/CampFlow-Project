import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarDays, Check, CreditCard, MapPin, TentTree, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import {
  addUiNotification,
  apiError,
  checkCampsiteAvailability,
  createReservation,
  idOf,
  labelOf,
  listCampgrounds,
  listCampsites,
  quoteReservation,
  type ApiItem,
} from '@/services/customerDashboardService';

type Values = {
  campground: string;
  campsite: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  vehicles: number;
  specialRequests: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
};

type StepKey = 'stay' | 'guests' | 'payment';

const stepOrder: Array<{ key: StepKey; label: string; index: number }> = [
  { key: 'stay', label: 'Your stay', index: 1 },
  { key: 'guests', label: 'Who’s coming', index: 2 },
  { key: 'payment', label: 'Payment', index: 3 },
];

export default function Reservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredCampground = searchParams.get('campground') ?? '';
  const preferredSite = searchParams.get('preferredSite') ?? '';
  const preferredCheckIn = searchParams.get('checkIn') ?? '';
  const preferredCheckOut = searchParams.get('checkOut') ?? '';

  const form = useForm<Values>({
    defaultValues: {
      campground: '',
      campsite: '',
      checkIn: preferredCheckIn,
      checkOut: preferredCheckOut,
      adults: 2,
      children: 0,
      vehicles: 1,
      specialRequests: '',
      cardName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
  });

  const [campgrounds, setCampgrounds] = useState<ApiItem[]>([]);
  const [sites, setSites] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<ApiItem | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const selectedCampground = form.watch('campground');
  const selectedSiteId = form.watch('campsite');
  const checkIn = form.watch('checkIn');
  const checkOut = form.watch('checkOut');
  const adults = form.watch('adults');
  const children = form.watch('children');
  const vehicles = form.watch('vehicles');

  const selectedSite = sites.find((site) => idOf(site) === selectedSiteId);
  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return checkIn && checkOut && end > start ? Math.ceil((end.getTime() - start.getTime()) / 86400000) : 0;
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!selectedSite || !checkIn || !checkOut || !nights) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    setQuoteError(null);
    quoteReservation({ campground: selectedCampground, campsite: selectedSiteId, checkIn, checkOut })
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch((caught) => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(apiError(caught, 'We could not quote this stay.'));
        }
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCampground, selectedSite, selectedSiteId, checkIn, checkOut, nights]);

  const total = Number(quote?.subtotal ?? 0);
  const taxes = Number(quote?.taxes ?? Math.round(total * 0.1 * 100) / 100);
  const fees = Number(quote?.fees ?? 0);
  const baseRate = Number(quote?.baseRate ?? 0);
  const grandTotal = Number(quote?.total ?? total + taxes + fees);

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

  const checkAvailability = async () => {
    if (!selectedCampground) {
      form.setError('campground', { message: 'Choose a campground first' });
      return;
    }
    if (!selectedSiteId) {
      form.setError('campsite', { message: 'Choose a campsite first' });
      return;
    }
    if (!checkIn || !checkOut || !nights) {
      form.setError('checkOut', { message: 'Choose a valid date range (departure after arrival)' });
      return;
    }
    setAvailabilityChecking(true);
    setError(null);
    setAvailabilityResult(null);
    try {
      const result = await checkCampsiteAvailability({ campground: selectedCampground, campsite: selectedSiteId, checkIn, checkOut });
      setAvailabilityResult({
        available: Boolean(result.available ?? true),
        message: String(result.message ?? 'Available for these dates'),
      });
    } catch (caught) {
      const status = (caught as any)?.response?.status;
      const message = apiError(caught, 'We could not check availability for these dates.');
      setAvailabilityResult({
        available: status === 409 ? false : true,
        message:
          status === 409
            ? 'Not available for these dates, please choose different dates or another site'
            : message,
      });
    } finally {
      setAvailabilityChecking(false);
    }
  };

  const submit = async (values: Values) => {
    if (!selectedSite || !nights) {
      if (!nights) form.setError('checkOut', { message: 'Departure must be after arrival' });
      return;
    }
    setError(null);
    if (quoteError) {
      setError(quoteError);
      return;
    }
    if (!quote) {
      setError('We could not calculate the price for these dates. Please adjust your stay.');
      return;
    }
    try {
      const reservation = await createReservation({
        campground: values.campground,
        campsite: values.campsite,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: {
          adults: Number(values.adults),
          children: Number(values.children),
          vehicles: Number(values.vehicles),
        },
        specialRequests: values.specialRequests || undefined,
        pricing: {
          baseRate: Number(quote.baseRate ?? total),
          nights: Number(quote.nights ?? nights),
          subtotal: Number(quote.subtotal ?? total),
          taxes: Number(quote.taxes ?? taxes),
          fees: Number(quote.fees ?? fees),
          discount: Number(quote.discount ?? 0),
          total: Number(quote.total ?? grandTotal),
        },
      });
      addUiNotification({
        type: 'booking_confirmation',
        title: 'Booking confirmed',
        message: `Your stay from ${values.checkIn} to ${values.checkOut} is confirmed.`,
      });
      addUiNotification({
        type: 'payment_confirmation',
        title: 'Payment confirmed',
        message: `Payment of $${grandTotal.toFixed(2)} confirmed for your stay at ${campgrounds.find((c) => idOf(c) === values.campground)?.name ?? 'the campground'}, ${values.checkIn}–${values.checkOut}.`,
      });
      navigate(`/reservation/confirmation/${idOf(reservation)}`, { replace: true });
    } catch (caught) {
      setError(apiError(caught, 'We could not create your reservation.'));
    }
  };

  const submitDisabled =
    form.formState.isSubmitting || quoting || (!!selectedSite && !!checkIn && !!checkOut && !!nights && !quote);

  const activeStep: StepKey = !selectedCampground || !selectedSiteId || !checkIn || !checkOut
    ? 'stay'
    : !valuesAreValidForPayment(form.watch())
      ? 'guests'
      : 'payment';

  const today = new Date().toISOString().slice(0, 10);
  const selectedCampgroundName = labelOf(
    campgrounds.find((c) => idOf(c) === selectedCampground),
    'Your campground'
  );
  const totalGuests = Number(adults || 0) + Number(children || 0);

  if (loading) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <section className="container-page pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow text-primary">Reservation</p>
            <h1 className="display-1 mt-5">
              Three steps, <span className="italic text-accent">one good trip.</span>
            </h1>
            <p className="lede mt-5 max-w-xl text-muted-foreground">
              Pick a place, tell us who’s coming, and confirm with a card. Your quote updates live as you choose.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">You won’t be charged until</p>
            <p className="mt-2 font-serif text-2xl text-foreground">the host confirms your dates</p>
          </div>
        </div>
      </section>

      <section className="container-page">
        <ol className="grid grid-cols-3 divide-x divide-border border border-border bg-card">
          {stepOrder.map(({ key, label, index }) => {
            const isActive = key === activeStep;
            const isComplete =
              (key === 'stay' && !!selectedCampground && !!selectedSiteId && !!checkIn && !!checkOut) ||
              (key === 'guests' &&
                !!selectedCampground &&
                !!selectedSiteId &&
                !!checkIn &&
                !!checkOut &&
                !!adults);
            return (
              <li key={key} className="flex items-start gap-4 px-5 py-5 md:px-7 md:py-6">
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center text-[11px] font-semibold tracking-[0.1em] ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isComplete
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {index}
                  </p>
                  <p className={`mt-1 font-serif text-lg leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {error && (
        <section className="container-page mt-6">
          <ErrorState title="Reservation unavailable" message={error} />
        </section>
      )}

      <section className="container-page mt-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
              <div className="space-y-0">
                <fieldset className="border border-border bg-card p-6 md:p-10">
                  <legend className="px-3 font-serif text-base text-foreground">Your stay</legend>
                  <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Where you’re going, and for how long. We’ll only show sites that fit your dates.
                    </p>
                    <FormField
                      control={form.control}
                      name="campground"
                      rules={{ required: 'Choose a campground' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campground</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Choose a location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {campgrounds.map((campground) => (
                                <SelectItem key={idOf(campground)} value={idOf(campground)}>
                                  {campground.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="checkIn"
                        rules={{ required: 'Arrival date is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrival</FormLabel>
                            <FormControl>
                              <Input type="date" min={today} className="bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkOut"
                        rules={{ required: 'Departure date is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure</FormLabel>
                            <FormControl>
                              <Input type="date" min={checkIn || today} className="bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="campsite"
                      rules={{ required: 'Choose a campsite' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campsite</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedCampground || checking}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder={checking ? 'Loading sites…' : 'Pick a site'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sites.map((site) => (
                                <SelectItem key={idOf(site)} value={idOf(site)}>
                                  {labelOf(site)} {site.type ? `· ${site.type}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={checkAvailability}
                        disabled={availabilityChecking || !selectedSiteId || !checkIn || !checkOut}
                        className="border-border bg-card"
                      >
                        {availabilityChecking ? <Spinner className="mr-2 size-2" /> : <CalendarDays className="mr-2 h-4 w-4" />}
                        Check availability
                      </Button>
                      {availabilityResult && (
                        <p
                          className={`text-sm ${
                            availabilityResult.available ? 'text-primary' : 'text-accent'
                          }`}
                        >
                          <span className="font-semibold">{availabilityResult.available ? 'Open' : 'Booked'}</span>
                          <span className="ml-2 text-muted-foreground">{availabilityResult.message}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border-x border-b border-border bg-card p-6 md:p-10">
                  <legend className="px-3 font-serif text-base text-foreground">Who’s coming</legend>
                  <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Adults, kids, and vehicles. Hosts use this to plan check-in and parking.
                    </p>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="adults"
                        rules={{ required: 'Add at least one adult', min: { value: 1, message: 'Add at least one adult' } }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adults</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                className="bg-background"
                                value={field.value}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="children"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Children</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                className="bg-background"
                                value={field.value}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicles</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                className="bg-background"
                                value={field.value}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes for the campground</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={3}
                              placeholder="Late check-in, accessibility needs, dietary restrictions…"
                              className="flex w-full rounded-sm border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </fieldset>

                <fieldset className="border border-border bg-card p-6 md:p-10">
                  <legend className="px-3 font-serif text-base text-foreground">Payment</legend>
                  <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      We pre-authorize the card and charge after the host confirms your dates.
                    </p>
                    <FormField
                      control={form.control}
                      name="cardName"
                      rules={{ required: 'Name on card is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name on card</FormLabel>
                          <FormControl>
                            <Input className="bg-background" placeholder="As it appears on your card" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      rules={{
                        required: 'Card number is required',
                        minLength: { value: 12, message: 'Enter a valid card number' },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card number</FormLabel>
                          <FormControl>
                            <Input className="bg-background font-mono tracking-wide" placeholder="1234 5678 9012 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="cardExpiry"
                        rules={{ required: 'Expiry is required', pattern: { value: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Use MM/YY' } }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry</FormLabel>
                            <FormControl>
                              <Input className="bg-background font-mono" placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardCvc"
                        rules={{ required: 'CVC is required', minLength: { value: 3, message: 'CVC is 3 or 4 digits' } }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input className="bg-background font-mono" placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </fieldset>
              </div>

              <aside className="lg:sticky lg:top-24">
                <div className="border border-border bg-card">
                  <div className="border-b border-border px-6 py-5 md:px-7 md:py-6">
                    <p className="eyebrow text-muted-foreground">Stay summary</p>
                    <p className="mt-2 font-serif text-2xl text-foreground">{selectedCampgroundName}</p>
                    {selectedSite ? (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {labelOf(selectedSite)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Pick a site to see details</p>
                    )}
                  </div>

                  <dl className="divide-y divide-border px-6 py-2 text-sm md:px-7">
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-muted-foreground">Dates</dt>
                      <dd className="text-right font-medium text-foreground">
                        {checkIn && checkOut
                          ? `${formatDate(checkIn)} – ${formatDate(checkOut)}`
                          : 'Select arrival & departure'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-muted-foreground">Nights</dt>
                      <dd className="font-medium text-foreground">{nights || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-muted-foreground">Guests</dt>
                      <dd className="text-right font-medium text-foreground">
                        {totalGuests ? `${totalGuests} guest${totalGuests === 1 ? '' : 's'}${vehicles ? ` · ${vehicles} vehicle${vehicles === 1 ? '' : 's'}` : ''}` : 'Add guests'}
                      </dd>
                    </div>
                  </dl>

                  <div className="border-t border-border bg-secondary/40 px-6 py-5 md:px-7">
                    <p className="eyebrow text-muted-foreground">Live price quote</p>
                    {quoting ? (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="size-2" /> Calculating…
                      </div>
                    ) : quote ? (
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            ${baseRate.toFixed(2)} × {nights} night{nights === 1 ? '' : 's'}
                          </dt>
                          <dd className="font-medium">${total.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Taxes</dt>
                          <dd className="font-medium">${taxes.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Fees</dt>
                          <dd className="font-medium">${fees.toFixed(2)}</dd>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                          <dt className="font-serif text-base text-foreground">Total</dt>
                          <dd className="font-serif text-3xl text-primary">${grandTotal.toFixed(2)}</dd>
                        </div>
                      </dl>
                    ) : quoteError ? (
                      <p className="mt-3 text-sm text-accent">{quoteError}</p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Choose a campground, site, and dates to see your total.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border px-6 py-5 md:px-7">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={submitDisabled}
                      onClick={form.handleSubmit(submit)}
                    >
                      {form.formState.isSubmitting ? <Spinner className="mr-2 size-2" /> : null}
                      {form.formState.isSubmitting ? 'Confirming…' : 'Confirm booking'}
                    </Button>
                    <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                      No charge until the campground confirms. Free cancellation up to 48 hours before arrival.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </Form>
      </section>
    </div>
  );
}

function valuesAreValidForPayment(values: Values) {
  return (
    !!values.campground &&
    !!values.campsite &&
    !!values.checkIn &&
    !!values.checkOut &&
    !!values.adults
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return value;
  }
}