import { Link } from 'react-router-dom';
import { Heart, Leaf, ShieldCheck, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const values = [
  {
    title: 'Nature first',
    body: 'We care for the trails, trees, and waterways that make every stay special — sourcing with patience and staying long enough to leave a place better than we found it.',
    icon: Leaf,
  },
  {
    title: 'Genuinely welcoming',
    body: 'Helpful hosts, clean spaces, and the small details that help everyone settle in. First campfire or fiftieth, you arrive as a guest and leave as a regular.',
    icon: Heart,
  },
  {
    title: 'Comfort outside',
    body: 'Thoughtful amenities that make getting outdoors feel easy, safe, and restorative. The kind of comfort that lets you forget about logistics and remember why you came.',
    icon: ShieldCheck,
  },
];

export default function About() {
  usePageMetadata(
    'About — CampFlow',
    'Learn how Green Valley campgrounds make outdoor stays easier, more comfortable, and more memorable.',
  );

  return (
    <div className="container-page space-y-24 pb-12 pt-12 md:space-y-32 md:pt-16">
      <section className="grid items-end gap-12 md:grid-cols-[1.05fr_1fr] md:gap-16">
        <div>
          <p className="eyebrow">Our story</p>
          <h1 className="display-1 mt-5">The good kind of getaway.</h1>
          <p className="lede mt-7 max-w-xl">
            Green Valley began with one family campground and a belief that time outside
            should feel easier to find. Today, our four locations are places for first
            campfires, annual traditions, and unhurried weekends.
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            We pair the character of each landscape with warm, straightforward
            hospitality — so you can spend less time figuring things out and more
            time being there.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link to="/campgrounds">Find your Green Valley</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/contact">Talk to a host</Link>
            </Button>
          </div>
        </div>
        <figure className="editorial-figure aspect-[4/5] md:aspect-[5/6]">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85"
            alt="Mountain valley at sunrise, mist drifting between ridges"
            className="h-full w-full object-cover"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-6 text-primary-foreground">
            <p className="eyebrow !text-primary-foreground/85">Pine Ridge, early morning</p>
            <p className="mt-1 font-serif text-lg leading-snug">
              Four valleys, one standard of welcome.
            </p>
          </figcaption>
        </figure>
      </section>

      <section className="rounded-[2px] bg-primary px-6 py-14 text-primary-foreground md:px-14 md:py-20">
        <Trees className="h-9 w-9 text-accent" />
        <blockquote className="mt-7 max-w-4xl font-serif text-3xl leading-[1.1] tracking-[-0.012em] md:text-5xl">
          &ldquo;We&rsquo;re here to make the outdoors feel like it belongs to everyone &mdash;
          not the few who already know the way.&rdquo;
        </blockquote>
        <p className="mt-8 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
          Mara Ellis &middot; Founder
        </p>
      </section>

      <section>
        <header className="grid items-end gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow">What guides us</p>
            <h2 className="display-2 mt-5">
              Leave with more than<br className="hidden md:block" /> you came with.
            </h2>
          </div>
          <p className="lede md:justify-self-end md:max-w-md">
            Three small commitments that shape every property, reservation email, and
            Saturday morning on the trail.
          </p>
        </header>

        <ol className="mt-14 divide-y divide-border border-y border-border">
          {values.map(({ title, body, icon: Icon }, index) => (
            <li key={title} className="grid gap-6 py-10 md:grid-cols-[6rem_1fr_auto] md:items-start md:gap-10 md:py-12">
              <span className="font-serif text-5xl leading-none text-accent md:text-6xl">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="md:max-w-xl">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="display-3 !text-2xl">{title}</h3>
                </div>
                <p className="lede mt-4">{body}</p>
              </div>
              <span aria-hidden className="hidden h-px w-12 bg-accent md:block md:self-center" />
            </li>
          ))}
        </ol>
      </section>

      <section>
        <header className="max-w-2xl">
          <p className="eyebrow">The arc of Green Valley</p>
          <h2 className="display-2 mt-5">A short history, told in two chapters.</h2>
        </header>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
          <article className="flex flex-col">
            <figure className="editorial-figure aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85"
                alt="A single tent pitched under tall pines at dusk"
                className="h-full w-full object-cover"
              />
            </figure>
            <p className="eyebrow mt-6">2009 &middot; Where we started</p>
            <h3 className="display-3 mt-3">One clearing, twelve sites.</h3>
            <p className="lede mt-4">
              Mara and her family bought a tired campground in Pine Ridge and spent
              a season walking every trail. They opened with twelve sites, a kettle
              that always stayed warm, and a notebook full of guest names.
            </p>
          </article>

          <article className="flex flex-col md:mt-16">
            <figure className="editorial-figure aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1200&q=85"
                alt="A row of canvas glamping tents glowing at golden hour"
                className="h-full w-full object-cover"
              />
            </figure>
            <p className="eyebrow mt-6">Today &middot; Where we are</p>
            <h3 className="display-3 mt-3">Four valleys, one way of hosting.</h3>
            <p className="lede mt-4">
              Green Valley now spans Pine Ridge, Lake Haven, Bluewater, and Cedar
              Creek. The kettle is still warm. The notebook is now a database, but
              we still learn every guest&rsquo;s name.
            </p>
          </article>
        </div>
      </section>

      <section className="grid items-center gap-10 rounded-[2px] bg-secondary px-6 py-12 md:grid-cols-[1.4fr_1fr] md:gap-14 md:px-14 md:py-16">
        <div>
          <p className="eyebrow !text-accent">Come outside</p>
          <h2 className="display-2 mt-4">
            Ready to plan a weekend<br className="hidden md:block" /> you&rsquo;ll remember?
          </h2>
          <p className="lede mt-5 max-w-xl">
            Browse our four locations, or talk to a host about a group trip. We&rsquo;ll
            help you pick the right valley for the kind of weekend you have in mind.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Button asChild size="lg">
            <Link to="/campgrounds">Browse campgrounds</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Plan a group stay</Link>
          </Button>
        </div>
      </section>

      <section className="hidden">
        <Card>
          <CardContent className="p-6">
            <Heart className="h-6 w-6 text-accent" />
            <p className="mt-3">Editorial flourish reserved for partners.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <p className="mt-3">Safety, considered.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}