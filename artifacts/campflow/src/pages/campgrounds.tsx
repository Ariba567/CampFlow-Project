import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarDays, Caravan, MapPin, Search, SlidersHorizontal, Star, Tent, Trees, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampsiteCategories from '@/components/campgrounds/CampsiteCategories';
import { listCampgrounds, type ApiItem } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';
import { campgroundImage } from '@/data/campground-images';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const locationLabel = (campground: ApiItem) =>
  [campground.address?.city, campground.address?.state].filter(Boolean).join(', ') ||
  (typeof campground.location === 'string' ? campground.location : 'Location details available soon');

const campsiteTypes = (campground: ApiItem): SiteType[] =>
  (campground.categories ?? campground.siteTypes ?? []) as SiteType[];

const categoryIcon = (type: SiteType) => {
  switch (type) {
    case 'rv':
      return Caravan;
    case 'tent':
      return Tent;
    case 'cabin':
      return BedDouble;
    case 'glamping':
      return Trees;
    default:
      return Trees;
  }
};

const startPrice = (campground: ApiItem): number | null => {
  const raw = campground.startingPrice ?? campground.priceFrom ?? campground.minPrice ?? campground.basePrice;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return null;
};

const availabilityNote = (campground: ApiItem): string | null => {
  const note = campground.availabilityNote ?? campground.nextAvailability ?? campground.highlight;
  if (typeof note === 'string' && note.trim() !== '') return note;
  const sites = Number(campground.totalSites);
  if (Number.isFinite(sites) && sites > 0) return `${sites} stays available`;
  return null;
};

const SEARCH_TYPES: Array<{ value: 'all' | SiteType; label: string }> = [
  { value: 'all', label: 'Any stay' },
  { value: 'rv', label: 'RV site' },
  { value: 'tent', label: 'Tent site' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'glamping', label: 'Glamping' },
];

export default function Campgrounds() {
  const [location, setLocation] = useState('all');
  const [siteType, setSiteType] = useState<'all' | SiteType>('all');
  const [query, setQuery] = useState('');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [guests, setGuests] = useState('2 guests');

  usePageMetadata(
    'Campgrounds — CampFlow',
    'Browse Green Valley campgrounds with filters for location and campsite type.',
  );

  const { data: campgrounds, loading, error } = useAsyncResource<ApiItem[]>(
    () => listCampgrounds(),
    [],
  );

  const locations = useMemo(
    () =>
      Array.from(new Set((campgrounds ?? []).map(locationLabel)))
        .filter(Boolean)
        .sort(),
    [campgrounds],
  );

  const filtered = useMemo(
    () =>
      (campgrounds ?? []).filter((campground) => {
        if (location !== 'all' && !locationLabel(campground).includes(location)) return false;
        if (siteType !== 'all' && !campsiteTypes(campground).includes(siteType)) return false;
        if (query) {
          const haystack = `${campground.name} ${locationLabel(campground)} ${campground.shortDescription ?? ''}`.toLowerCase();
          if (!haystack.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [campgrounds, location, siteType, query],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const totalCount = campgrounds?.length ?? 0;

  return (
    <div className="container-page pb-24">
      <section className="pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow">The Green Valley Collection</p>
            <h1 className="display-1 mt-5">
              A small, considered list of <span className="italic text-primary">places to sleep outside.</span>
            </h1>
          </div>
          <div className="md:col-span-4 md:pl-8 md:border-l md:border-border/80">
            <p className="lede">
              Four privately-run campgrounds, each shaped by its landscape. Filter by where you want to
              wake up and how you want to stay — we’ll handle the rest.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-[64px] z-30 -mx-5 mb-12 border-y border-border bg-background/95 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="grid items-end gap-4 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="cg-search">
              Where
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                id="cg-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search campground or city"
                className="h-11 w-full border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="cg-arrival">
              Arrival
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                id="cg-arrival"
                type="date"
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="h-11 w-full border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="cg-departure">
              Departure
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                id="cg-departure"
                type="date"
                value={departure}
                onChange={(event) => setDeparture(event.target.value)}
                min={arrival || new Date().toISOString().slice(0, 10)}
                className="h-11 w-full border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="cg-guests">
              Guests
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <select
                id="cg-guests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="h-11 w-full appearance-none border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option>1 guest</option>
                <option>2 guests</option>
                <option>3 guests</option>
                <option>4 guests</option>
                <option>5+ guests</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="cg-type">
              Stay type
            </label>
            <Select value={siteType} onValueChange={(value) => setSiteType(value as 'all' | SiteType)}>
              <SelectTrigger id="cg-type" className="h-11 rounded-none border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ButtonLink to="/campgrounds" label="Search" />
        </div>
      </section>

      <section className="hairline pb-6">
        <div className="flex flex-col gap-5 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <p className="eyebrow !text-foreground">Refine</p>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3 md:max-w-3xl md:justify-end">
            <div className="md:w-64">
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-10 rounded-none border-border bg-card">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(location !== 'all' || siteType !== 'all' || query) && !loading && !error && (
              <button
                type="button"
                onClick={() => {
                  setLocation('all');
                  setSiteType('all');
                  setQuery('');
                }}
                className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-accent hover:underline underline-offset-4"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {loading ? (
            <p className="text-sm italic text-muted-foreground">Gathering the campgrounds…</p>
          ) : error ? (
            <p className="text-sm italic text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of {totalCount} campgrounds
            </p>
          )}
        </div>
      </section>

      {loading ? (
        <section className="grid gap-10 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="editorial-figure">
              <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-24 animate-pulse bg-muted" />
                <div className="h-8 w-2/3 animate-pulse bg-muted" />
                <div className="h-3 w-full animate-pulse bg-muted" />
                <div className="h-3 w-5/6 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </section>
      ) : error ? (
        <section className="border border-dashed border-border bg-card p-10 text-center">
          <p className="eyebrow">Something went quiet</p>
          <h2 className="display-3 mt-3">We can’t reach the campground list.</h2>
          <p className="lede mx-auto mt-3 max-w-prose">{error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="border border-dashed border-border bg-card p-12 text-center">
          <p className="eyebrow">No matches</p>
          <h2 className="display-3 mt-3">Nothing here for that combination.</h2>
          <p className="lede mx-auto mt-3 max-w-prose">
            Try widening the location or site type — most travelers start with “all”.
          </p>
          <button
            type="button"
            onClick={() => {
              setLocation('all');
              setSiteType('all');
              setQuery('');
            }}
            className="mt-6 inline-flex h-10 items-center border border-border bg-card px-4 text-sm font-medium text-foreground hover:border-foreground"
          >
            Reset filters
          </button>
        </section>
      ) : (
        <section className="space-y-16">
          {featured && (
            <article className="grid gap-8 border-b border-border/80 pb-16 md:grid-cols-12">
              <Link
                to={`/campgrounds/${featured.slug}?arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`}
                className="editorial-figure group block overflow-hidden md:col-span-7"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={campgroundImage(featured)}
                    alt={featured.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    loading="eager"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 bg-card/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                    <span className="size-1.5 rounded-full bg-accent" />
                    Open this weekend
                  </span>
                </div>
              </Link>
              <div className="flex flex-col justify-between md:col-span-5">
                <div>
                  <p className="eyebrow text-accent">Editor’s pick</p>
                  <h2 className="display-2 mt-3">{featured.name}</h2>
                  <p className="lede mt-4">{featured.shortDescription}</p>

                  <dl className="mt-6 grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Location</dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {locationLabel(featured)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Property size</dt>
                      <dd className="mt-1 text-foreground">{featured.totalSites ?? '—'} sites</dd>
                    </div>
                    {startPrice(featured) !== null && (
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">From</dt>
                        <dd className="mt-1 font-serif text-2xl text-foreground">${startPrice(featured)}<span className="ml-1 text-xs font-sans font-normal text-muted-foreground">/night</span></dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Availability</dt>
                      <dd className="mt-1 text-foreground">{availabilityNote(featured) ?? 'Live dates on next page'}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {campsiteTypes(featured).map((type) => {
                      const Icon = categoryIcon(type);
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground"
                        >
                          <Icon className="h-3 w-3 text-accent" />
                          {siteCategories[type]?.name ?? type}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Reserve directly — no platform fees, real-time availability.
                  </p>
                  <Link
                    to={`/campgrounds/${featured.slug}?arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`}
                    className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:text-accent"
                  >
                    View campground
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <div className="space-y-px bg-border">
              {rest.map((campground, i) => {
                const types = campsiteTypes(campground);
                const price = startPrice(campground);
                const availability = availabilityNote(campground);
                const img = campgroundImage(campground);
                const reverse = i % 2 === 1;
                return (
                  <article
                    key={campground.slug}
                    className="grid items-center gap-10 bg-card p-6 md:grid-cols-12 md:gap-12 md:p-10"
                  >
                    <Link
                      to={`/campgrounds/${campground.slug}?arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`}
                      className={`editorial-figure block md:col-span-5 ${reverse ? 'md:order-2' : ''}`}
                    >
                      <div className="relative aspect-[5/4] overflow-hidden">
                        <img
                          src={img}
                          alt={campground.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
                        />
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-card/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                          <span className="size-1.5 rounded-full bg-accent" />
                          {availability ?? 'Live dates'}
                        </span>
                      </div>
                    </Link>

                    <div className={`md:col-span-7 ${reverse ? 'md:order-1' : ''}`}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-accent" />
                          {locationLabel(campground)}
                        </span>
                        {Number(campground.rating?.average) > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            {Number(campground.rating.average).toFixed(1)}
                            {Number(campground.rating.count) > 0 && (
                              <span className="tracking-normal normal-case">({campground.rating.count})</span>
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="display-2 mt-3">
                        <Link to={`/campgrounds/${campground.slug}?arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`} className="hover:text-primary">
                          {campground.name}
                        </Link>
                      </h3>
                      <p className="lede mt-3 max-w-xl">{campground.shortDescription}</p>

                      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5 text-sm">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Sites</dt>
                          <dd className="mt-1 font-medium text-foreground">{campground.totalSites ?? '—'}</dd>
                        </div>
                        {price !== null && (
                          <div>
                            <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">From</dt>
                            <dd className="mt-1 font-serif text-xl text-foreground">${price}<span className="ml-1 text-[10px] font-sans font-normal uppercase tracking-[0.16em] text-muted-foreground">/night</span></dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stay types</dt>
                          <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-foreground">
                            {types.map((type, idx) => (
                              <span key={type} className="inline-flex items-center">
                                {idx > 0 && <span className="mr-2 text-muted-foreground/40">·</span>}
                                {siteCategories[type]?.name ?? type}
                              </span>
                            ))}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <Link
                          to={`/campgrounds/${campground.slug}?arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`}
                          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent"
                        >
                          View details
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="hairline mt-24 pt-16">
        <div className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow">Stay your way</p>
            <h2 className="display-2 mt-4">Choose your kind of camp.</h2>
          </div>
          <p className="lede md:col-span-5 md:pl-8 md:border-l md:border-border/80">
            From canvas under the stars to a heated cabin after a cold river swim — every campground hosts a
            different mix.
          </p>
        </div>
        <CampsiteCategories />
      </section>
    </div>
  );
}

import { Button } from '@/components/ui/button';

function ButtonLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to}>
      <Button className="h-11 w-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
        {label} <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}