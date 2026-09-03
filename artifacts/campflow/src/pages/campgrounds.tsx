import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, SlidersHorizontal, Trees, Tent, Caravan, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function Campgrounds() {
  const [location, setLocation] = useState('all');
  const [siteType, setSiteType] = useState<'all' | SiteType>('all');

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
      (campgrounds ?? []).filter(
        (campground) =>
          (location === 'all' || locationLabel(campground).includes(location)) &&
          (siteType === 'all' || campsiteTypes(campground).includes(siteType)),
      ),
    [campgrounds, location, siteType],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const totalCount = campgrounds?.length ?? 0;

  return (
    <div className="container-page pb-24">
      <section className="pt-16 pb-14 md:pt-24 md:pb-20">
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
              wake up and how you want to stay — we'll handle the rest.
            </p>
          </div>
        </div>
      </section>

      <section className="hairline pb-12">
        <div className="flex flex-col gap-5 pt-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <p className="eyebrow !text-foreground">Refine the list</p>
          </div>
          <div className="grid flex-1 gap-4 md:grid-cols-2 md:max-w-xl">
            <div>
              <label className="mb-2 block text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="location-filter">
                Location
              </label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location-filter" className="rounded-[2px] border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground" htmlFor="site-filter">
                Site type
              </label>
              <Select value={siteType} onValueChange={(value) => setSiteType(value as 'all' | SiteType)}>
                <SelectTrigger id="site-filter" className="rounded-[2px] border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All site types</SelectItem>
                  {Object.entries(siteCategories).map(([value, category]) => (
                    <SelectItem key={value} value={value}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {loading ? (
            <p className="text-sm italic text-muted-foreground">Gathering the campgrounds…</p>
          ) : error ? (
            <p className="text-sm italic text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of {totalCount} campgrounds
            </p>
          )}
          {(location !== 'all' || siteType !== 'all') && !loading && !error && (
            <button
              type="button"
              onClick={() => {
                setLocation('all');
                setSiteType('all');
              }}
              className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-accent hover:underline underline-offset-4"
            >
              Clear filters
            </button>
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
          <h2 className="display-3 mt-3">We can't reach the campground list.</h2>
          <p className="lede mx-auto mt-3 max-w-prose">{error}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="border border-dashed border-border bg-card p-12 text-center">
          <p className="eyebrow">No matches</p>
          <h2 className="display-3 mt-3">Nothing here for that combination.</h2>
          <p className="lede mx-auto mt-3 max-w-prose">
            Try widening the location or site type — most travelers start with "all".
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-md"
            onClick={() => {
              setLocation('all');
              setSiteType('all');
            }}
          >
            Reset filters
          </Button>
        </section>
      ) : (
        <section className="space-y-16">
          {featured && (
            <article className="grid gap-10 border-b border-border/80 pb-16 md:grid-cols-12">
              <Link
                to={`/campgrounds/${featured.slug}`}
                className="editorial-figure group block md:col-span-7"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={campgroundImage(featured)}
                    alt={featured.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    loading="eager"
                  />
                </div>
              </Link>
              <div className="flex flex-col justify-between md:col-span-5">
                <div>
                  <p className="eyebrow">Editor's pick</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{locationLabel(featured)}</span>
                  </div>
                  <h2 className="display-2 mt-4">{featured.name}</h2>
                  <p className="lede mt-5">{featured.shortDescription}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {campsiteTypes(featured).map((type) => {
                      const Icon = categoryIcon(type);
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-foreground"
                        >
                          <Icon className="h-3.5 w-3.5 text-accent" />
                          {siteCategories[type]?.name ?? type}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between gap-6 border-t border-border/80 pt-6">
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <dt className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">Sites</dt>
                    <dd className="font-medium text-foreground">{featured.totalSites ?? '—'}</dd>
                    {startPrice(featured) !== null && (
                      <>
                        <dt className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">From</dt>
                        <dd className="font-medium text-foreground">${startPrice(featured)} <span className="text-muted-foreground">/ night</span></dd>
                      </>
                    )}
                  </dl>
                  <Link
                    to={`/campgrounds/${featured.slug}`}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent"
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
                    className={`grid items-center gap-10 bg-card p-6 md:grid-cols-12 md:gap-12 md:p-10 ${
                      reverse ? 'md:[direction:rtl]' : ''
                    }`}
                  >
                    <Link
                      to={`/campgrounds/${campground.slug}`}
                      className={`editorial-figure block md:col-span-5 ${reverse ? 'md:[direction:ltr]' : ''}`}
                    >
                      <div className="aspect-[5/4] overflow-hidden">
                        <img
                          src={img}
                          alt={campground.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
                        />
                      </div>
                    </Link>

                    <div className={`md:col-span-7 ${reverse ? 'md:[direction:ltr]' : ''}`}>
                      <div className="flex items-center justify-between text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {locationLabel(campground)}
                        </span>
                        {availability && <span className="text-foreground">{availability}</span>}
                      </div>
                      <h3 className="display-2 mt-3">
                        <Link to={`/campgrounds/${campground.slug}`} className="hover:text-primary">
                          {campground.name}
                        </Link>
                      </h3>
                      <p className="lede mt-3 max-w-xl">{campground.shortDescription}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5">
                        <span className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{campground.totalSites ?? '—'}</span> sites
                          {price !== null && (
                            <>
                              <span className="mx-2 text-border">/</span>
                              <span className="font-medium text-foreground">${price}</span> from / night
                            </>
                          )}
                        </span>
                        <div className="ml-auto flex items-center gap-3">
                          <div className="hidden flex-wrap gap-1.5 md:flex">
                            {types.map((type) => (
                              <span key={type} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {siteCategories[type]?.name ?? type}
                              </span>
                            )).reduce<React.ReactNode[]>((acc, node, idx, arr) => {
                              if (idx > 0) acc.push(<span key={`s-${idx}`} className="px-0.5 text-muted-foreground/40">·</span>);
                              acc.push(node);
                              return acc;
                            }, [])}
                          </div>
                          <Link
                            to={`/campgrounds/${campground.slug}`}
                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
                          >
                            View
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
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