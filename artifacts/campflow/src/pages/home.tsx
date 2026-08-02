import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Mountain, Sparkles, TentTree, Trees, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siteCategories } from '@/data/campgrounds';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const stays = [
  { title: 'RV sites', description: 'Pull-through and back-in sites with full hookups and room to settle in.', icon: Mountain, image: siteCategories.rv.image, alt: 'RV parked at a wooded campsite' },
  { title: 'Tent sites', description: 'Shaded, peaceful plots that put you close to the trail and the campfire.', icon: TentTree, image: siteCategories.tent.image, alt: 'Tent campsite in the woods' },
  { title: 'Cabins & glamping', description: 'A little more comfort, with real beds and the outdoors at your door.', icon: Sparkles, image: siteCategories.glamping.image, alt: 'Canvas glamping tent surrounded by nature' },
];

const locations = ['Pine Ridge, Colorado', 'Lake Haven, Michigan', 'Bluewater, Oregon', 'Cedar Creek, Tennessee'];

export default function Home() {
  usePageMetadata('Home — CampFlow', 'Discover CampFlow campgrounds, activities, and bookings for your next outdoor adventure.');
  return (
    <div className="space-y-20 pb-10 md:space-y-28">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-primary-foreground shadow-xl md:px-12 md:py-24">
        <img
          src="https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1800&q=70"
          alt="Family campsite among tall trees"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30" />
        <div className="relative max-w-3xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/80"><Trees className="h-4 w-4" /> Green Valley Campgrounds</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">Make room for the wild.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/85">Four welcoming campgrounds, countless ways to unplug. Find an RV site, tent site, cabin, or glamping stay made for your next good story.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/campgrounds">Explore campgrounds <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground"><Link to="/activities">Plan your adventure</Link></Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Stay your way</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Simple stays, well spent.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {stays.map(({ title, description, icon: Icon, image, alt }) => (
            <Card key={title} className="group overflow-hidden border-card-border transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-48 overflow-hidden">
                <img src={image} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent" />
              </div>
              <CardContent className="p-6">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-10 rounded-3xl bg-secondary/55 p-6 md:grid-cols-2 md:p-10">
        <img src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1100&q=70" alt="Sunlight through a forest" loading="lazy" className="h-72 w-full rounded-2xl object-cover md:h-full" />
        <div className="max-w-xl py-2 md:px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Four places to gather</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">A favorite spot is waiting.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">From lakeside mornings to mountain sunsets, each Green Valley location has its own pace and personality.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {locations.map((location) => <li key={location} className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-accent" />{location}</li>)}
          </ul>
          <Button asChild variant="outline" className="mt-8"><Link to="/campgrounds">See all locations <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="text-center">
        <Users className="mx-auto h-7 w-7 text-accent" />
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Bring the people who make the trip memorable.</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Roast marshmallows, swap trail stories, and wake up somewhere worth looking around.</p>
        <Button asChild className="mt-8"><Link to="/contact">Talk to our camping team</Link></Button>
      </section>
    </div>
  );
}
