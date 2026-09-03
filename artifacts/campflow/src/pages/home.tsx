import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, TentTree, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteCategories, campgrounds } from '@/data/campgrounds';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const featured = campgrounds[0];
const sideFeatures = campgrounds.slice(1);

const stayOrder = ['rv', 'tent', 'cabin', 'glamping'] as const;

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
    detail: 'Pine Ridge · September',
  },
  {
    quote: 'First time in a canvas tent and I was a skeptic. By the second night we had lanterns up, kids asleep early, and the most quiet I have heard in years. We are already rebooking.',
    name: 'Jordan P.',
    detail: 'Bluewater · June',
  },
  {
    quote: 'The site map made it easy to pick a spot near the creek for our dog and a little distance from the loop for our kids. CampFlow made a complicated family trip feel simple.',
    name: 'The Aldana family',
    detail: 'Cedar Creek · August',
  },
];

export default function Home() {
  usePageMetadata('Home — CampFlow', 'Discover CampFlow campgrounds, activities, and bookings for your next outdoor adventure.');

  const [destination, setDestination] = useState('Anywhere');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [guests, setGuests] = useState('2 guests');
  const [stayType, setStayType] = useState('Any stay');

  return (
    <div className="pb-10">
      <section className="relative">
        <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2000&q=80"
            alt="Tent glowing under a starry sky in the mountains"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-primary/45 to-primary/80" />
          <div className="container-page relative z-10 flex h-full flex-col justify-end pb-16 md:pb-20">
            <div className="max-w-3xl">
              <p className="eyebrow text-primary-foreground/85">An outdoor stay, booked simply</p>
              <h1 className="display-1 mt-5 text-primary-foreground">
                Find your corner of the outdoors.
              </h1>
              <p className="lede mt-6 max-w-2xl text-primary-foreground/90">
                CampFlow is a small group of campgrounds across four handpicked locations.
                Book a tent pad, an RV pull-through, a woodsmoke cabin, or a furnished canvas stay &mdash;
                all in one place.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/campgrounds">Explore campgrounds <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/reservation">Plan your trip</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-10 md:-mt-14 relative z-20">
        <div className="border border-border bg-card p-5 shadow-[0_24px_60px_-30px_rgba(28,28,28,0.35)] md:p-7">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <p className="eyebrow text-primary">Plan your stay</p>
            <p className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:block">Where · When · Who · What</p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_auto] md:items-end"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Where</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 w-full appearance-none rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Anywhere</option>
                  {campgrounds.map((c) => (
                    <option key={c.slug}>{c.location}</option>
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
              <div className="relative">
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
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stay type</span>
              <div className="relative">
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
            </label>

            <Button type="submit" size="lg" className="h-12 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/reservation">Search <ArrowRight /></Link>
            </Button>
          </form>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <header className="mb-12 flex items-end justify-between gap-6 border-b border-border pb-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">The collection</p>
            <h2 className="display-2 mt-4">Four places to wander.</h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-muted-foreground md:block">
            Mountain air, lakeside mornings, river bends, and a Tennessee creek — each shaped by its own landscape.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-12">
          <Link
            to={`/campgrounds/${featured.slug}`}
            className="group editorial-figure relative block overflow-hidden md:col-span-7"
          >
            <div className="aspect-[4/5] w-full overflow-hidden">
              <img
                src={featured.image}
                alt={`${featured.name} campground`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-5 flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow text-accent">The cover story</p>
                <h3 className="display-3 mt-2">{featured.name}</h3>
                <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">{featured.shortDescription}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">{featured.location}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{featured.totalSites} sites</p>
              </div>
            </figcaption>
          </Link>

          <div className="grid gap-8 md:col-span-5">
            {sideFeatures.map((c) => (
              <Link
                key={c.slug}
                to={`/campgrounds/${c.slug}`}
                className="group flex items-start gap-5 border-t border-border pt-6 first:pt-0 md:border-t-0 md:pt-0"
              >
                <div className="aspect-square w-32 shrink-0 overflow-hidden">
                  <img
                    src={c.image}
                    alt={`${c.name} campground`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="flex-1">
                  <p className="eyebrow text-muted-foreground">{c.location}</p>
                  <h3 className="mt-1 font-serif text-2xl tracking-tight">{c.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.shortDescription}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Hand-picked locations from Colorado to Tennessee.</p>
          <Link to="/campgrounds" className="inline-flex items-center gap-2 font-semibold text-primary">
            See all four campgrounds <ArrowRight className="h-4 w-4" />
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

        <div className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-2">
          {stayOrder.map((key) => {
            const cat = siteCategories[key];
            return (
              <Link
                key={key}
                to={`/categories/${key}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
              >
                <div className="aspect-[5/4] w-full overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow text-accent">{`0${stayOrder.indexOf(key) + 1}`}</p>
                    <h3 className="display-3 mt-2">{cat.name}</h3>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                </div>
                <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">{cat.description}</p>
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
            Trails, water, and small traditions — the kind of days that end with sand in the car and a plan to come back.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-12 gap-5">
          <Link
            to="/activities"
            className="group relative col-span-12 block aspect-[16/9] overflow-hidden md:col-span-7 md:aspect-[5/4]"
          >
            <img
              src={activities[0].image}
              alt={activities[0].alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="eyebrow text-primary-foreground/85">From camp to ridgeline</p>
              <h3 className="display-3 mt-2 text-primary-foreground">{activities[0].title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/85">{activities[0].note}</p>
            </div>
          </Link>

          <div className="col-span-12 grid grid-cols-2 gap-5 md:col-span-5 md:grid-rows-2">
            <Link to="/activities" className="group relative aspect-square overflow-hidden">
              <img src={activities[1].image} alt={activities[1].alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-xl text-primary-foreground">{activities[1].title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/85">{activities[1].note}</p>
              </div>
            </Link>
            <Link to="/activities" className="group relative aspect-square overflow-hidden">
              <img src={activities[2].image} alt={activities[2].alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-xl text-primary-foreground">{activities[2].title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/85">{activities[2].note}</p>
              </div>
            </Link>
            <Link to="/activities" className="group relative col-span-2 aspect-[2/1] overflow-hidden md:aspect-[5/2]">
              <img src={activities[3].image} alt={activities[3].alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-serif text-xl text-primary-foreground">{activities[3].title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/85">{activities[3].note}</p>
              </div>
            </Link>
          </div>

          <Link
            to="/activities"
            className="group relative col-span-12 block aspect-[16/10] overflow-hidden md:col-span-5"
          >
            <img src={activities[4].image} alt={activities[4].alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-serif text-2xl text-primary-foreground">{activities[4].title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/85">{activities[4].note}</p>
            </div>
          </Link>

          <div className="col-span-12 md:col-span-7">
            <Link to="/activities" className="group block md:grid md:grid-cols-[1fr_1.4fr] md:gap-6">
              <div className="aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
                <img src={activities[5].image} alt={activities[5].alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              </div>
              <div className="mt-5 md:mt-0 md:flex md:flex-col md:justify-end">
                <p className="eyebrow text-accent">For the curious ones</p>
                <h3 className="display-3 mt-2">{activities[5].title}</h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{activities[5].note}. A cold creek, a slow afternoon, and the kind of exploring kids remember for years.</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Browse activities <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <div className="border-y border-border py-16 md:py-20">
          <div className="grid items-start gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="eyebrow text-primary">Why CampFlow</p>
              <h2 className="display-2 mt-4">A short list of promises.</h2>
            </div>
            <ol className="md:col-span-8">
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
                    <h3 className="font-serif text-xl tracking-tight">{v.title}</h3>
                    <p className="mt-2 max-w-xl text-base leading-7 text-muted-foreground">{v.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page mt-24 md:mt-32">
        <header className="mb-14 max-w-3xl">
          <p className="eyebrow text-primary">Field notes</p>
          <h2 className="display-2 mt-4">What guests remember.</h2>
          <p className="lede mt-5 text-muted-foreground">
            Notes from stays at our properties — the kind we get in emails, in trailhead conversations, and occasionally in thank-you cards.
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
              Browse sites, pick your stay, and confirm in a few minutes. No calls, no back-and-forth — just a reservation and a road trip.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 md:min-w-[260px]">
              <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
            </Button>
            <Link
              to="/reservation"
              className="inline-flex items-center gap-2 self-end text-sm font-medium text-foreground/80 hover:text-primary"
            >
              Or jump straight to a reservation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}