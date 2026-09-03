import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  CalendarDays,
  Check,
  Dog,
  Flame,
  Heart,
  MapPin,
  Mountain,
  ShoppingBag,
  Sparkles,
  Star,
  Trees,
  Users,
  Waves,
  Wifi,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CampsiteCategories from '@/components/campgrounds/CampsiteCategories';
import InteractiveCampMap from '@/components/campgrounds/InteractiveCampMap';
import {
  addFavorite,
  checkReviewEligibility,
  getCampground,
  listCampgroundReviews,
  listCampsites,
  listFavorites,
  removeFavorite,
  type ApiItem,
} from '@/services/customerDashboardService';
import { useAuth } from '@/context/AuthContext';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import type { SiteType } from '@/data/campgrounds';
import { campgroundImage } from '@/data/campground-images';
import { siteCategories } from '@/data/campgrounds';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';

const locationLabel = (campground: ApiItem) =>
  [campground.address?.city, campground.address?.state].filter(Boolean).join(', ') ||
  'Location details available soon';

const campsiteTypes = (campground: ApiItem): SiteType[] =>
  (campground.categories ?? campground.siteTypes ?? []) as SiteType[];

const idOf = (item: ApiItem) => String(item._id ?? item.id);

const amenityIconMap: Array<[RegExp, typeof Trees]> = [
  [/wifi|wi-fi|internet/i, Wifi],
  [/bath|shower|restroom/i, Bath],
  [/dog|pet/i, Dog],
  [/fire|firewood|fire ring/i, Flame],
  [/store|shop|essentials/i, ShoppingBag],
  [/lake|river|creek|water|fishing|swim/i, Waves],
  [/trail|hike|forest|tree|nature/i, Trees],
  [/family|kid|play/i, Users],
  [/mountain|view/i, Mountain],
];

const pickAmenityIcon = (amenity: string) => {
  for (const [pattern, Icon] of amenityIconMap) {
    if (pattern.test(amenity)) return Icon;
  }
  return Check;
};

const galleryFromCampground = (campground: ApiItem, main: string | undefined) => {
  const candidates: unknown[] = [];
  if (main) candidates.push(main);
  if (Array.isArray(campground.gallery)) candidates.push(...campground.gallery);
  if (Array.isArray(campground.images)) candidates.push(...campground.images);
  if (campground.coverImage) candidates.push(campground.coverImage);
  const seen = new Set<string>();
  return candidates.filter((value): value is string => {
    if (typeof value !== 'string' || value.length === 0) return false;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function CampgroundDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const [campground, setCampground] = useState<ApiItem | null>(null);
  const [sites, setSites] = useState<ApiItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [filterType, setFilterType] = useState<SiteType | null>(null);
  const [reviews, setReviews] = useState<ApiItem[]>([]);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number | null; totalReviews: number }>({
    averageRating: null,
    totalReviews: 0,
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [eligibleReservationId, setEligibleReservationId] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const [arrival, setArrival] = useState(searchParams.get('arrival') ?? addDays(7));
  const [departure, setDeparture] = useState(searchParams.get('departure') ?? addDays(9));
  const [guests, setGuests] = useState(searchParams.get('guests') ?? '2 guests');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  usePageMetadata(
    campground ? `${campground.name} — CampFlow` : 'Campground details — CampFlow',
    'Explore campground details, site availability, and amenities for your next stay.',
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getCampground(slug)
      .then(async (campgroundData) => {
        setCampground(campgroundData);
        const [sitesData, favoritesResult] = await Promise.all([
          listCampsites(idOf(campgroundData)),
          isAuthenticated ? listFavorites().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);
        setSites(sitesData);
        setFavoriteIds(favoritesResult.data.map((item) => idOf(item)));
      })
      .catch(() => setError('We could not load campground details.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, slug]);

  useEffect(() => {
    if (!campground) return;
    const cid = idOf(campground);
    if (!cid) return;
    setLoadingReviews(true);
    setReviewError(null);
    listCampgroundReviews(cid)
      .then((result) => {
        setReviews(result.data);
        setReviewStats({ averageRating: result.averageRating, totalReviews: result.totalReviews });
      })
      .catch(() => setReviewError('Could not load reviews.'))
      .finally(() => setLoadingReviews(false));
  }, [campground]);

  useEffect(() => {
    if (!campground || !isAuthenticated || user?.role !== 'customer') return;
    const cid = idOf(campground);
    if (!cid) return;
    setCheckingEligibility(true);
    checkReviewEligibility(cid)
      .then((result) => {
        setEligible(result.eligible);
        setEligibleReservationId(result.reservationId);
      })
      .catch(() => {
        setEligible(false);
        setEligibleReservationId(null);
      })
      .finally(() => setCheckingEligibility(false));
  }, [campground, isAuthenticated, user?.role]);

  const typeCounts = useMemo(
    () =>
      sites.reduce<Record<string, number>>(
        (counts, site) => ({
          ...counts,
          [String(site.type ?? 'unknown')]: (counts[String(site.type ?? 'unknown')] ?? 0) + 1,
        }),
        {},
      ),
    [sites],
  );

  const availableTypes = useMemo(() => {
    const fromInventory = [...new Set(sites.map((site) => String(site.type ?? '')))].filter(Boolean) as SiteType[];
    return fromInventory.length > 0 ? fromInventory : campground ? campsiteTypes(campground) : [];
  }, [campground, sites]);

  const visibleSites = useMemo(
    () => (filterType ? sites.filter((site) => String(site.type ?? '') === filterType) : sites),
    [filterType, sites],
  );

  const handleToggleFavorite = async (site: ApiItem) => {
    if (!isAuthenticated) {
      setFavoriteError('Sign in to save favorites.');
      return;
    }
    const id = idOf(site);
    setSavingFavorite(true);
    setFavoriteError(null);
    try {
      if (favoriteIds.includes(id)) {
        await removeFavorite(id);
        setFavoriteIds((current) => current.filter((itemId) => itemId !== id));
      } else {
        await addFavorite(id);
        setFavoriteIds((current) => [...current, id]);
      }
    } catch {
      setFavoriteError('Could not update favorites.');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleExplore = (type: SiteType) => {
    setFilterType(type);
    const target = document.getElementById('where-to-stay');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <p className="lede">Loading campground…</p>
      </div>
    );
  }
  if (error || !campground) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <p className="lede text-destructive">{error ?? 'Campground not found.'}</p>
      </div>
    );
  }

  const campgroundId = idOf(campground);
  const heroImage = campgroundImage(campground);
  const gallery = galleryFromCampground(campground, heroImage);
  const stripImages = gallery.slice(1, 5);
  const whileStripFiller =
    stripImages.length > 0
      ? stripImages
      : [siteCategories.tent.image, siteCategories.cabin.image, siteCategories.glamping.image, siteCategories.rv.image];
  const totalGalleryImages = [heroImage, ...whileStripFiller].filter(Boolean) as string[];
  const activeImage = totalGalleryImages[activeImageIndex] ?? heroImage;
  const totalSitesCount = campground.totalSites ?? sites.length ?? 0;
  const userReview = reviews.find((r) => {
    const customerId = typeof r.customer === 'string' ? r.customer : String(r.customer?._id ?? r.customer?.id ?? '');
    return customerId === user?.id;
  });
  const handleReviewSubmitted = () => {
    if (!campgroundId) return;
    listCampgroundReviews(campgroundId)
      .then((result) => {
        setReviews(result.data);
        setReviewStats({ averageRating: result.averageRating, totalReviews: result.totalReviews });
      })
      .catch(() => setReviewError('Could not load reviews.'));
  };
  const startingPrice = useMemo(() => {
    const prices = sites
      .map((site) => Number(site.pricePerNight ?? site.basePrice ?? site.price))
      .filter((value) => Number.isFinite(value) && value > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [sites]);

  const nightCount = useMemo(() => {
    if (!arrival || !departure) return 0;
    const a = new Date(arrival);
    const b = new Date(departure);
    return a < b ? Math.ceil((b.getTime() - a.getTime()) / 86400000) : 0;
  }, [arrival, departure]);

  const reservationUrl = `/reservation?campground=${campgroundId}&arrival=${arrival}&departure=${departure}&guests=${encodeURIComponent(guests)}`;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="pb-24">
        <section className="container-page pt-6 md:pt-10">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Button asChild variant="ghost" size="sm" className="-ml-3 gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/campgrounds">
                <ArrowLeft className="h-4 w-4" /> All campgrounds
              </Link>
            </Button>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                {locationLabel(campground)}
              </p>
              <h1 className="display-1 mt-4">{campground.name}</h1>
              <p className="lede mt-5 max-w-2xl">{campground.shortDescription}</p>
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-5 text-sm">
                {reviewStats.totalReviews > 0 && reviewStats.averageRating !== null && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Guest rating</dt>
                    <dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      {reviewStats.averageRating.toFixed(1)}
                      <span className="text-muted-foreground">/ 5 · {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Sites</dt>
                  <dd className="mt-1 font-medium text-foreground">{totalSitesCount} on the property</dd>
                </div>
                {startingPrice !== null && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">From</dt>
                    <dd className="mt-1 font-medium text-foreground">${startingPrice}<span className="text-muted-foreground"> / night</span></dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Stay types</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-2 text-foreground">
                    {availableTypes.map((type, i) => (
                      <span key={type} className="inline-flex items-center">
                        {i > 0 && <span className="mr-2 text-muted-foreground/40">·</span>}
                        {siteCategories[type].name}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col items-stretch gap-3 lg:items-end">
              <Button
                asChild
                size="lg"
                className="h-12 w-full bg-primary px-6 text-primary-foreground hover:bg-primary/90 lg:w-auto"
              >
                <a href="#where-to-stay">
                  Choose your site <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full border-border bg-card lg:w-auto"
              >
                <a href="#campground-about">Read the story</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page mt-8 md:mt-12">
          <div className="grid gap-3 md:grid-cols-12 md:grid-rows-2 md:h-[520px]">
            <div className="editorial-figure relative overflow-hidden md:col-span-7 md:row-span-2 h-64 md:h-full">
              {activeImage ? (
                <img src={activeImage} alt={`${campground.name} view`} className="h-full w-full object-cover" loading="eager" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground">Image coming soon</div>
              )}
              <span className="absolute right-3 top-3 bg-card/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                {activeImageIndex + 1} / {totalGalleryImages.length}
              </span>
            </div>
            {whileStripFiller.slice(0, 4).map((src, index) => (
              <button
                type="button"
                key={`${src}-${index}`}
                onClick={() => setActiveImageIndex(index + 1)}
                className={`editorial-figure relative h-32 overflow-hidden md:h-full ${
                  activeImageIndex === index + 1 ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
              >
                <img src={src} alt={`${campground.name} gallery ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/70 to-transparent p-3 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-primary-foreground">
                  View {index + 2}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="container-page mt-10 md:mt-14">
          <div className="border border-border bg-card p-5 md:p-6">
            <div className="grid items-end gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground" htmlFor="cd-arrival">
                  Arrival
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  <input
                    id="cd-arrival"
                    type="date"
                    min={today()}
                    value={arrival}
                    onChange={(event) => setArrival(event.target.value)}
                    className="h-11 w-full border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground" htmlFor="cd-departure">
                  Departure
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  <input
                    id="cd-departure"
                    type="date"
                    min={arrival || today()}
                    value={departure}
                    onChange={(event) => setDeparture(event.target.value)}
                    className="h-11 w-full border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground" htmlFor="cd-guests">
                  Guests
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  <select
                    id="cd-guests"
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    className="h-11 w-full appearance-none border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Stay</p>
                <p className="mt-2 font-serif text-2xl text-foreground">
                  {nightCount > 0 ? `${nightCount} night${nightCount === 1 ? '' : 's'}` : 'Pick dates'}
                </p>
                {startingPrice !== null && nightCount > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    From <span className="font-medium text-foreground">${(startingPrice * nightCount).toFixed(0)}</span> total
                  </p>
                )}
              </div>
              <Button asChild size="lg" className="h-11 w-full bg-primary px-6 text-primary-foreground hover:bg-primary/90 md:w-auto">
                <Link to={reservationUrl}>
                  Reserve <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="campground-about" className="container-page mt-20 md:mt-28">
          <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <div>
              <p className="eyebrow">The story</p>
              <h2 className="display-2 mt-3">A quiet basecamp shaped by its surroundings.</h2>
              <div className="container-prose mt-6 space-y-5 text-[1.0625rem] leading-[1.75] text-muted-foreground">
                {(campground.description ?? '').split(/\n+/).filter(Boolean).map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div>
              <div className="hairline pt-6">
                <p className="eyebrow">What's included</p>
                <h3 className="display-3 mt-3">Amenities for every kind of camper.</h3>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5">
                {(campground.amenities ?? []).map((amenity: string) => {
                  const Icon = pickAmenityIcon(amenity);
                  return (
                    <li key={amenity} className="flex items-start gap-3 border-b border-border/60 pb-3 last:border-0">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-secondary text-primary">
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm leading-6 text-foreground">{amenity}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className="container-page mt-20 md:mt-28">
          <header className="flex items-end justify-between gap-6 border-b border-border pb-6">
            <h2 className="display-2 max-w-2xl">Pick the kind of site that fits your trip.</h2>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-muted-foreground md:block">
              Browse by category — tent pads, RV pull-throughs, canvas glamping, and woodsmoke cabins.
            </p>
          </header>
          <div className="mt-10">
            <CampsiteCategories types={availableTypes} onExplore={handleExplore} />
          </div>
        </section>

        <section id="where-to-stay" className="container-page mt-20 md:mt-28">
          <div className="hairline pt-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="display-2">Find your site on the map.</h2>
                <p className="lede mt-4">
                  Filter by category to narrow the list. Tap any site card to see it light up on the map, then reserve directly.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="rounded-none border border-border bg-card px-3 py-1 text-xs font-medium">
                  {visibleSites.length} of {sites.length} sites
                </Badge>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType(null)}
                className={`border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition ${
                  filterType === null
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                All
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition ${
                    filterType === type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {siteCategories[type].name}
                </button>
              ))}
            </div>

            {favoriteError && <p className="mt-4 text-sm text-destructive">{favoriteError}</p>}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
              <div className="space-y-4">
                {visibleSites.length === 0 ? (
                  <div className="border border-dashed border-border bg-card p-10 text-center">
                    <p className="lede">No {filterType ? siteCategories[filterType].name : 'sites'} available at this campground right now.</p>
                    <Button variant="link" className="mt-3 px-0" onClick={() => setFilterType(null)}>Show all sites</Button>
                  </div>
                ) : (
                  visibleSites.map((site) => {
                    const siteId = idOf(site);
                    const isFavorite = favoriteIds.includes(siteId);
                    const siteType = String(site.type ?? '') as SiteType;
                    const category = siteCategories[siteType];
                    const nightly = Number(site.pricePerNight ?? site.basePrice);
                    const totalForStay = Number.isFinite(nightly) && nightCount > 0 ? nightly * nightCount : null;
                    return (
                      <article
                        key={siteId}
                        className="group flex flex-col overflow-hidden border border-border bg-card transition hover:border-primary/40 sm:flex-row"
                      >
                        <div className="editorial-figure relative h-48 shrink-0 sm:h-auto sm:w-44 md:w-52">
                          <img
                            src={category?.image ?? heroImage}
                            alt={site.name ?? `Site ${siteId}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-card/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                            <span className="size-1.5 rounded-full bg-accent" />
                            Available
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-5">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              {category?.name ?? 'Site'} · #{siteId}
                            </p>
                            <h3 className="mt-1 font-serif text-xl">{site.name ?? `Site ${siteId}`}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {site.description ?? `A comfortable ${(category?.name ?? 'site').toLowerCase()} ready for your stay.`}
                            </p>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                            <div>
                              {Number.isFinite(nightly) && (
                                <p className="font-serif text-lg text-foreground">${nightly}<span className="ml-1 text-xs font-sans font-normal text-muted-foreground">/night</span></p>
                              )}
                              {totalForStay !== null && (
                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                  ${totalForStay.toFixed(0)} for {nightCount} night{nightCount === 1 ? '' : 's'}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className={`h-9 w-9 border-border ${isFavorite ? 'border-accent text-accent' : ''}`}
                                    disabled={savingFavorite}
                                    onClick={() => void handleToggleFavorite(site)}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                                  >
                                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isFavorite ? 'Remove from favorites' : 'Save to favorites'}</TooltipContent>
                              </Tooltip>
                              <Button
                                asChild
                                size="sm"
                                className="bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                              >
                                <Link
                                  to={`/reservation?campground=${campgroundId}&preferredSite=${siteId}&checkIn=${arrival}&checkOut=${departure}&guests=${encodeURIComponent(guests)}`}
                                >
                                  Reserve <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p className="eyebrow">Park map</p>
                <h3 className="display-3 mt-3">Pick your corner of the property.</h3>
                <p className="lede mt-3">Markers reflect current availability for your dates.</p>
                <div className="mt-6">
                  <InteractiveCampMap
                    campgroundName={campground.name}
                    campgroundId={campgroundId}
                    initialArrival={arrival}
                    initialDeparture={departure}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page mt-20 md:mt-28">
          <div className="hairline pt-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="eyebrow">Reviews</p>
                <h2 className="display-2 mt-3">What campers are saying.</h2>
                {reviewStats.totalReviews > 0 ? (
                  <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-serif text-2xl">{reviewStats.averageRating?.toFixed(1)}</span>
                    </span>
                    <span className="divider-dot" />
                    <span>{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''} from verified guests</span>
                  </div>
                ) : (
                  <p className="lede mt-5">Be the first to share what you thought of this place.</p>
                )}
                <div className="mt-10">
                  {loadingReviews ? (
                    <p className="lede">Loading reviews…</p>
                  ) : reviewError ? (
                    <p className="lede">{reviewError}</p>
                  ) : (
                    <ReviewList
                      reviews={reviews}
                      averageRating={reviewStats.averageRating}
                      totalReviews={reviewStats.totalReviews}
                    />
                  )}
                </div>
              </div>
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="border border-border bg-card p-6">
                  <p className="eyebrow">Leave a review</p>
                  <h3 className="display-3 mt-3">{userReview ? 'Edit your review' : 'Share your stay.'}</h3>
                  {isAuthenticated && user?.role === 'customer' ? (
                    checkingEligibility ? (
                      <p className="lede mt-4">Checking your eligibility…</p>
                    ) : eligible && eligibleReservationId ? (
                      <div className="mt-5">
                        <ReviewForm
                          campgroundId={campgroundId}
                          reservationId={eligibleReservationId}
                          existingReview={userReview}
                          onSubmitted={handleReviewSubmitted}
                        />
                      </div>
                    ) : (
                      <p className="lede mt-4">
                        You can leave a review after your stay at this campground is complete.
                      </p>
                    )
                  ) : (
                    <p className="lede mt-4">
                      <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link> to leave a review once your stay is complete.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="container-page mt-20 md:mt-28">
          <div className="relative overflow-hidden border border-border bg-primary text-primary-foreground">
            <img
              src="https://images.unsplash.com/photo-1455763916899-e8b50eca9967?auto=format&fit=crop&w=1800&q=80"
              alt="Lantern light beside a tent at dusk"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
              <div className="max-w-xl">
                <p className="eyebrow flex items-center gap-2 text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> Ready when you are
                </p>
                <h2 className="display-2 mt-3 text-primary-foreground">Plan your stay at {campground.name}.</h2>
                <p className="mt-4 text-base leading-7 text-primary-foreground/80">
                  Filter by category, save the sites you love, and book directly when you’re ready.
                </p>
              </div>
              <Button asChild className="h-12 bg-accent px-6 text-accent-foreground hover:bg-accent/90">
                <a href="#where-to-stay">Browse sites <ArrowRight className="h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}