import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Star, TentTree, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteCategories, type SiteType } from '@/data/campgrounds';
import { campgroundImage } from '@/data/campground-images';
import { listCampgrounds, type ApiItem } from '@/services/customerDashboardService';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const stayOrder = ['rv', 'tent', 'cabin', 'glamping'] as const;

const locationLabel = (campground: ApiItem) =>
  [campground.address?.city, campground.address?.state].filter(Boolean).join(', ') ||
  (typeof campground.location === 'string' ? campground.location : 'Campground');

const campsiteTypes = (campground: ApiItem): SiteType[] =>
  (campground.categories ?? campground.siteTypes ?? []) as SiteType[];

const minRate = (campground: ApiItem): number | null => {
  const raw = campground.startingPrice ?? campground.priceFrom ?? campground.minPrice ?? campground.basePrice;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const ratingOf = (campground: ApiItem): { average: number; count: number } | null => {
  const avg = Number(campground.rating?.average ?? 0);
  const count = Number(campground.rating?.count ?? 0);
  if (Number.isFinite(avg) && avg > 0) return { average: avg, count };
  return null;
};

const siteCountLabel = (campground: ApiItem): string | null => {
  const count = Number(campground.totalSites ?? 0);
  if (Number.isFinite(count) && count > 0) return `${count} stays`;
  return null;
};

const activities = [
  {
    title: 'Hiking',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=85',
    alt: 'Hikers walking through a forest trail',
    note: 'Trailheads from camp',
  },
  {
    title: 'Fishing',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
    alt: 'Fishing rod over still lake water',
    note: 'Quiet mornings on the water',
  },
  {
    title: 'Kayaking',
    image: 'https://images.unsplash.com/photo-1463693396721-8ca0cfa2b3b5?auto=format&fit=crop&w=1200&q=85',
    alt: 'Kayaker paddling on a calm lake',
    note: 'Paddle launches at every property',
  },
  {
    title: 'Stargazing',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=85',
    alt: 'Star-filled night sky over the forest',
    note: 'Dark skies, late nights',
  },
  {
    title: 'Campfire nights',
    image: 'https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=1200&q=85',
    alt: 'Campfire ring glowing at dusk',
    note: 'Firewood delivered to your site',
  },
  {
    title: 'Creek exploring',
    image: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=1200&q=85',
    alt: 'Shallow creek running through rocks and moss',
    note: 'Wade in, slow down',
  },
];

const values = [
  {
    title: 'Real places, honestly kept',
    body: 'We invest in the land, the trails, and the small details that make a campground feel looked after. Nothing overdesigned, nothing precious.',
  },
  {
    title: 'Book in minutes, not weeks',
    body: 'A clear site map, transparent pricing, and a reservation flow that respects your time. You came here to plan a getaway, not fill out a form.',
  },
  {
    title: 'Hosts who actually camp',
    body: 'Our team spends real nights at our properties every season. The advice you get comes from people who know the sites and the weather and the trail at the back of the loop.',
  },
];

const testimonials = [
  {
    quote: 'We pulled in after dark and the host had flagged our site, left a hand-drawn map, and texted us the best walk for the next morning. Felt like staying with a friend who happened to know the mountain.',
    name: 'Maren & Eli',
    detail: 'Green Valley Blue Ridge · September',
  },
  {
    quote: 'First time in a canvas tent and I was a skeptic. By the second night we had lanterns up, kids asleep early, and the most quiet I have heard in years. We are already rebooking.',
    name: 'Jordan P.',
    detail: 'Green Valley Lakeside · June',
  },
  {
    quote: 'The site map made it easy to pick a spot near the creek for our dog and a little distance from the loop for our kids. CampFlow made a complicated family trip feel simple.',
    name: 'The Aldana family',
    detail: 'Green Valley Redwoods · August',
  },
];
export default function Home() {
  usePageMetadata('Home — CampFlow', 'Discover CampFlow campgrounds, activities, and bookings for your next outdoor adventure.');

  const { data: liveCampgrounds, loading, error, reload } = useAsyncResource<ApiItem[]>(() => listCampgrounds(), []);
  const campgrounds = useMemo(() => liveCampgrounds ?? [], [liveCampgrounds]);
  const featured = campgrounds[0];
  const sideFeatures = campgrounds.slice(1, 4);

  const [destination, setDestination] = useState('Anywhere');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [guests, setGuests] = useState('2 guests');
  const [stayType, setStayType] = useState('Any stay');

  return (
    <div className="pb-10">
      <section className="relative">
        <div className="relative h-[58vh] min-h-[420px] max-h-[620px] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2000&q=80"
            alt="Tent glowing under a starry sky at a mountain campsite"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/45 via-primary/45 to-primary/80" />
          <div className="container-page relative z-10 flex h-full flex-col justify-end pb-14 md:pb-16">
            <div className="max-w-3xl">
              <p className="eyebrow text-primary-foreground/90">An outdoor stay, booked simply</p>
              <h1 className="display-1 mt-4 text-primary-foreground">
                Find your corner of the outdoors.
              </h1>
              <p className="lede mt-5 max-w-2xl text-primary-foreground/95">
                CampFlow is a small group of campgrounds across four handpicked locations.
                Book a tent pad, an RV pull-through, a woodsmoke cabin, or a furnished canvas stay &mdash;
                all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
<div className="container-page relative z-20 -mt-8 md:-mt-10">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              window.location.assign('/campgrounds');
            }}
            className="grid gap-4 border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_1fr_2fr] md:items-end md:p-6"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Destination</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 w-full appearance-none rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Anywhere</option>
                  {campgrounds.map((c) => (
                    <option key={String(c.slug ?? '')}>{locationLabel(c)}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Arrival</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <input
                  type="date"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="h-12 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Departure</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <input
                  type="date"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="h-12 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Who</span>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="h-12 w-full appearance-none rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>1 guest</option>
                    <option>2 guests</option>
                    <option>3 guests</option>
                    <option>4 guests</option>
                    <option>5+ guests</option>
                  </select>
                </div>
                <div className="relative flex-1">
                  <TentTree className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  <select
                    value={stayType}
                    onChange={(e) => setStayType(e.target.value)}
                    className="h-12 w-full appearance-none rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>Any stay</option>
                    <option>RV site</option>
                    <option>Tent site</option>
                    <option>Cabin</option>
                    <option>Glamping tent</option>
                  </select>
                </div>
                <Button type="submit" size="lg" className="h-12 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90">
                  Search <ArrowRight />
                </Button>
              </div>
            </label>
          </form>
        </div>
      </section>
<section className="container-page mt-24 md:mt-28">
        <header className="mb-12 flex items-end justify-between gap-6 border-b border-border pb-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">The collection</p>
            <h2 className="display-2 mt-4">Four places to wander.</h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-muted-foreground md:block">
            Mountain air, lakeside mornings, river bends, and redwood evenings &mdash; each shaped by its own landscape.
          </p>
        </header>

        {loading && (
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="aspect-[16/10] w-full animate-pulse bg-secondary" />
            </div>
            <div className="grid gap-8 md:col-span-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-5 border-t border-border pt-6 first:pt-0">
                  <div className="aspect-[4/3] w-32 shrink-0 animate-pulse bg-secondary" />
                  <div className="h-20 flex-1 animate-pulse bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="border border-border bg-card p-10 text-center">
            <p className="lede">We could not load the campgrounds right now.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={reload}>Try again</Button>
              <Button asChild>
                <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && featured && (
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
<Link
              to={`/campgrounds/${String(featured.slug)}`}
              className="group editorial-figure relative block overflow-hidden md:col-span-7"
            >
              <div className="aspect-[16/10] w-full overflow-hidden md:aspect-[16/11]">
                <img
                  src={campgroundImage(featured)}
                  alt={`${featured.name} campground`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent p-6 pt-16 md:p-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-primary-foreground/95">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5" /> {locationLabel(featured)}
                  </span>
                  {ratingOf(featured) && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <Star className="h-3.5 w-3.5 fill-current text-accent" />
                      {ratingOf(featured)!.average.toFixed(1)}
                    </span>
                  )}
                  {siteCountLabel(featured) && (
                    <span className="text-sm text-primary-foreground/90">{siteCountLabel(featured)}</span>
                  )}
                </div>
                <h3 className="display-3 mt-2 text-primary-foreground">{featured.name}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/95">{featured.shortDescription}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {minRate(featured) !== null && (
                    <p className="font-serif text-xl text-primary-foreground">
                      From ${minRate(featured)!.toFixed(0)}
                      <span className="ml-1 text-xs font-sans uppercase tracking-[0.16em] text-primary-foreground/90">/night</span>
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    View campground <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="grid gap-6 md:col-span-5 md:gap-7">
{sideFeatures.map((c) => (
                <Link
                  key={String(c.slug ?? '')}
                  to={`/campgrounds/${String(c.slug)}`}
                  className="group flex items-start gap-5 border-b border-border pb-6 last:border-0 md:flex-col lg:flex-row"
                >
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden md:w-full lg:w-36">
                    <img
                      src={campgroundImage(c)}
                      alt={`${c.name} campground`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-accent" /> {locationLabel(c)}
                      </span>
                      {ratingOf(c) && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" /> {ratingOf(c)!.average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-serif text-2xl tracking-tight text-foreground">{c.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{c.shortDescription}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {minRate(c) !== null && (
                        <p className="text-sm font-semibold text-foreground">
                          From ${minRate(c)!.toFixed(0)}
                          <span className="ml-1 text-xs font-normal uppercase tracking-[0.14em] text-muted-foreground">/night</span>
                        </p>
                      )}
                      {siteCountLabel(c) && (
                        <span className="text-xs text-muted-foreground">· {siteCountLabel(c)}</span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && campgrounds.length === 0 && (
          <div className="border border-border bg-card p-10 text-center">
            <p className="lede">No campgrounds are available right now. Check back soon.</p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Hand-picked locations from the mountains to the coast.</p>
          <Link to="/campgrounds" className="inline-flex items-center gap-2 font-semibold text-primary">
            See all campgrounds <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow text-primary">Stay types</p>
            <h2 className="display-2 mt-4">Sleep outside, your way.</h2>
          </div>
          <p className="lede text-muted-foreground">
            Four ways to wake up here. Pick the level of canvas, comfort, and campfire you want for the trip.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
        {stayOrder.map((key) => {
            const cat = siteCategories[key];
            return (
              <Link
                key={key}
                to={`/categories/${key}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
              >
                <div className="aspect-[5/4] w-full overflow-hidden bg-card">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <h3 className="font-serif text-xl tracking-tight text-foreground">{cat.name}</h3>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{cat.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <header className="grid items-end gap-6 border-b border-border pb-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow text-primary">Days at camp</p>
            <h2 className="display-2 mt-4">Make the long weekend longer.</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Trails, water, and small traditions &mdash; the kind of days that end with sand in the car and a plan to come back.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-12 gap-5">
          <Link
            to="/activities"
            className="group relative col-span-12 block aspect-[16/9] overflow-hidden md:col-span-7 md:aspect-[16/10]"
          >
            <img
              src={activities[0].image}
              alt={activities[0].alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="eyebrow text-primary-foreground/90">From camp to ridgeline</p>
              <h3 className="display-3 mt-2 text-primary-foreground">{activities[0].title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/90">{activities[0].note}</p>
            </div>
          </Link>
          <div className="col-span-12 grid grid-cols-2 gap-5 md:col-span-5">
{activities.slice(1, 5).map((a) => (
              <Link
                key={a.title}
                to="/activities"
                className="group relative block aspect-[4/3] overflow-hidden bg-card"
              >
                <img
                  src={a.image}
                  alt={a.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-serif text-lg text-primary-foreground">{a.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-primary-foreground/90">{a.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <div className="grid items-end gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow text-primary">Why CampFlow</p>
            <h2 className="display-2 mt-4">Built by people who sleep in tents.</h2>
          </div>
        </div>

        <div className="mt-12 border-t border-border">
          <ol>
            {values.map((v, i) => (
              <li
                key={v.title}
                className={`grid grid-cols-[auto_1fr] items-start gap-6 py-7 md:grid-cols-[56px_1fr] md:gap-10 ${
                  i === 0 ? 'border-t-0' : 'border-t border-border'
                }`}
              >
                <span className="font-serif text-2xl leading-none text-accent md:pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground">{v.title}</h3>
                  <p className="mt-2 max-w-xl text-base leading-7 text-muted-foreground">{v.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <header className="mb-14 max-w-3xl">
          <p className="eyebrow text-primary">Field notes</p>
          <h2 className="display-2 mt-4">What guests remember.</h2>
          <p className="lede mt-5 text-muted-foreground">
            Notes from stays at our properties &mdash; the kind we get in emails, in trailhead conversations, and occasionally in thank-you cards.
          </p>
        </header>

        <div className="grid gap-x-12 gap-y-14 md:grid-cols-12 md:gap-y-0">
{testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`flex flex-col md:col-span-4 ${
                i === 1 ? 'md:border-x md:border-border md:px-10 md:py-2' : 'md:pr-6'
              } ${i === 2 ? 'md:pl-6' : ''}`}
            >
              <span aria-hidden className="font-serif text-5xl leading-none text-accent">&ldquo;</span>
              <blockquote className="mt-2 font-serif text-[1.18rem] leading-[1.6] text-foreground md:text-[1.25rem] md:leading-[1.55]">
                {t.quote}
              </blockquote>
              <figcaption className="mt-7 flex flex-col gap-1 border-t border-border pt-4">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{t.name}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <div className="grid items-end gap-10 border-t border-border pt-16 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow text-primary">Start planning</p>
            <h2 className="display-2 mt-4">Pick a corner of the map. We will handle the rest.</h2>
            <p className="lede mt-5 max-w-xl text-muted-foreground">
              Browse sites, pick your stay, and confirm in a few minutes. No calls, no back-and-forth &mdash; just a reservation and a road trip.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 md:min-w-[260px]">
              <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
            </Button>
            <Link
              to="/campgrounds"
              className="inline-flex items-center gap-2 self-end text-sm font-medium text-foreground/80 hover:text-primary"
            >
              Compare locations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}