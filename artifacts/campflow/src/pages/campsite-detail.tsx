import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { apiError, getCampground, idOf, listCampsites, type ApiItem } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function CampsiteDetail() {
  const { slug, siteId } = useParams();
  const [campground, setCampground] = useState<ApiItem | null>(null);
  const [sites, setSites] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata(
    'Campsite details — CampFlow',
    'Pick a stay type for your next campground trip at CampFlow.',
  );

  useEffect(() => {
    if (!slug) {
      setError('This campsite link is missing a campground.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getCampground(slug), listCampsites()])
      .then(([campgroundData, allSites]) => {
        if (cancelled) return;
        setCampground(campgroundData);
        const cid = idOf(campgroundData);
        setSites(cid ? allSites.filter((site) => String(site.campground) === cid) : []);
      })
      .catch((caught) => {
        if (!cancelled) setError(apiError(caught, 'We could not load this campsite.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const site = useMemo(
    () => sites.find((candidate) => idOf(candidate) === siteId) ?? null,
    [sites, siteId],
  );

  if (loading) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  if (error || !slug) {
    return (
      <div className="container-page space-y-6 py-10">
        <ErrorState title="Campsite unavailable" message={error ?? 'This campsite could not be found.'} />
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/campgrounds">Browse all campgrounds</Link>
          </Button>
          {slug && (
            <Button asChild>
              <Link to={`/campgrounds/${slug}`}>Back to {campground?.name ?? 'campground'}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container-page space-y-6 py-10">
        <Button asChild variant="link" className="h-auto px-0 text-muted-foreground hover:text-foreground">
          <Link to={`/campgrounds/${slug}`}>
            <ArrowLeft /> {campground?.name ?? 'Campground'}
          </Link>
        </Button>
        <div className="border border-border bg-card p-10 text-center">
          <p className="eyebrow">Campsite</p>
          <h1 className="display-2 mt-3">This campsite is no longer available.</h1>
          <p className="lede mx-auto mt-4 max-w-prose">
            It may have been removed or is currently offline. Browse the live site map to pick another spot.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to={`/campgrounds/${slug}#where-to-stay`}>View the site map</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
const campgroundId = idOf(campground ?? undefined);
  const siteType = String(site.type ?? '') as SiteType;
  const category = siteType ? siteCategories[siteType] : undefined;
  const image = site.images?.[0] || category?.image;
  const nightly = Number(site.basePrice ?? site.pricePerNight ?? 0);
  const weekendNightly = Number(site.weekendPrice ?? nightly);
  const capacity = site.capacity as { maxGuests?: number; maxRvLength?: number; maxTents?: number } | undefined;
  const maxGuests = Number(capacity?.maxGuests ?? 4);
  const features = Array.isArray(site.features) ? (site.features as string[]) : [];
  const amenities = Array.isArray(site.amenities) ? (site.amenities as string[]) : [];

  const reserveUrl = `/reservation?campground=${campgroundId}&preferredSite=${idOf(site)}&checkIn=${today()}&checkOut=${addDays(2)}`;

  return (
    <div className="container-page space-y-12 pb-24 pt-6 md:pt-10">
      <nav aria-label="Breadcrumb">
        <Button asChild variant="ghost" size="sm" className="-ml-3 gap-2 text-muted-foreground hover:text-foreground">
          <Link to={`/campgrounds/${slug}`}>
            <ArrowLeft className="h-4 w-4" /> {campground?.name ?? 'Campground'}
          </Link>
        </Button>
      </nav>

      <section className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="editorial-figure relative aspect-[16/10] overflow-hidden bg-card md:aspect-[16/9]">
          {image ? (
            <img src={image} alt={site.name ?? 'Campsite'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">Image coming soon</div>
          )}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 bg-card/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
            <span className={`size-1.5 rounded-full ${site.isAvailable === false ? 'bg-muted-foreground/50' : 'bg-accent'}`} />
            {site.isAvailable === false ? 'Offline' : 'Available'}
          </span>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                {site.siteNumber ?? site.name}
              </span>
              {campground && (
                <span className="inline-flex items-center gap-1.5">{campground.name}</span>
              )}
            </div>
            <h1 className="display-1 mt-3">{site.name ?? `Site ${site.siteNumber}`}</h1>
            {category && (
              <p className="lede mt-4">{category.name}</p>
            )}
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {site.description ?? `A ${(category?.name ?? 'campsite').toLowerCase()} ready for your stay.`}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
              {maxGuests > 0 && (
                <div className="bg-card p-4">
                  <Users className="h-4 w-4 text-accent" />
                  <p className="mt-2 font-serif text-xl text-foreground">{maxGuests}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Max guests</p>
                </div>
              )}
              {capacity?.maxRvLength && Number(capacity.maxRvLength) > 0 && (
                <div className="bg-card p-4">
                  <Check className="h-4 w-4 text-accent" />
                  <p className="mt-2 font-serif text-xl text-foreground">{capacity.maxRvLength}&apos;</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Max RV length</p>
                </div>
              )}
              {capacity?.maxTents && Number(capacity.maxTents) > 0 && (
                <div className="bg-card p-4">
                  <Check className="h-4 w-4 text-accent" />
                  <p className="mt-2 font-serif text-xl text-foreground">{capacity.maxTents}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Max tents</p>
                </div>
              )}
            </div>
            <div className="mt-8 border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">From</p>
                <p className="mt-1 font-serif text-3xl text-foreground">
                  {nightly > 0 ? `$${nightly.toFixed(0)}` : '—'}
                  <span className="ml-1 text-xs font-sans uppercase tracking-[0.16em] text-muted-foreground">/night</span>
                </p>
                {weekendNightly > nightly && (
                  <p className="mt-1 text-xs text-muted-foreground">Weekend rate ${weekendNightly.toFixed(0)}/night</p>
                )}
              </div>
              <Button asChild size="lg" className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                <Link to={reserveUrl}>
                  Reserve this site <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-accent" />
              Rates are set by each campground. Weekend, holiday, and promotional tiers apply to your selected dates.
            </p>
            </div>
          </div>
        </div>
      </section>

      {features.length > 0 && (
        <section>
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl text-foreground">Site features</h2>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature} variant="outline" className="rounded-[2px] border-border px-3 py-1.5 font-normal text-foreground">
                {feature}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {amenities.length > 0 && (
        <section>
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl text-foreground">Amenities at the site</h2>
          </div>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-3 text-sm text-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-secondary text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {amenity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {campground && (
        <section className="grid gap-8 border-t border-border pt-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="eyebrow">Paperwork done</p>
            <h2 className="display-3 mt-2">Ready to lock in the dates?</h2>
            <p className="lede mt-2">
              Pick your dates at {campground.name}, see the live site map, and confirm in a few minutes.
            </p>
          </div>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={`/campgrounds/${String(campground.slug ?? slug)}#where-to-stay`}>
              Open the site map <ArrowRight />
            </a>
          </Button>
        </section>
      )}
    </div>
  );
}