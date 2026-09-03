import { Bath, Dog, Flame, ShowerHead, ShoppingBag, Trees, Wifi, Waves } from 'lucide-react';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const amenities = [
  { title: 'Clean restrooms', description: 'Well-maintained facilities close to every camping loop.', icon: Bath, group: 'comfort' },
  { title: 'Hot showers', description: 'Private, hot showers for a comfortable reset after the trail.', icon: ShowerHead, group: 'comfort' },
  { title: 'Wi-Fi zones', description: 'Reliable connection around our lodges and camp stores.', icon: Wifi, group: 'connect' },
  { title: 'Pet-friendly areas', description: 'Room for leashed dogs to stretch, sniff, and settle in.', icon: Dog, group: 'comfort' },
  { title: 'Fire pits', description: 'A classic fire ring or pit at most sites, with wood nearby.', icon: Flame, group: 'gather' },
  { title: 'General stores', description: 'Ice, firewood, essentials, and local snacks when you need them.', icon: ShoppingBag, group: 'gather' },
  { title: 'Nature trails', description: 'Easy walks and longer routes right from your campground.', icon: Trees, group: 'explore' },
  { title: 'Water access', description: 'Lakes, creeks, or paddle launches at select Green Valley locations.', icon: Waves, group: 'explore' },
];

const groups = [
  { id: 'comfort', label: 'Quiet comforts', intro: 'The everyday things that make a long weekend feel easy.' },
  { id: 'gather', label: 'Around the fire', intro: 'Shared spaces and small conveniences for evenings outside.' },
  { id: 'connect', label: 'Stay in touch', intro: 'A signal when you want it, the quiet when you do not.' },
  { id: 'explore', label: 'Out the door', intro: 'Quick ways to step straight into the surrounding land and water.' },
] as const;

export default function Amenities() {
  usePageMetadata(
    'Amenities — CampFlow',
    'See the shared amenities at Green Valley campgrounds, from showers and Wi-Fi to pet-friendly sites and camp stores.',
  );

  return (
    <div className="container-page space-y-24 pb-24 pt-12 md:space-y-32 md:pt-16">
      <section className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">Thoughtful essentials</p>
          <h1 className="display-1 mt-5">Comforts that let you stay outside longer.</h1>
        </div>
        <p className="lede md:col-span-4 md:col-start-9">
          Every Green Valley location has its own character, with shared amenities designed to make
          camping simple and comfortable — never louder than the place you came for.
        </p>
      </section>

      <section className="space-y-20">
        {groups.map((group, groupIdx) => {
          const items = amenities.filter((a) => a.group === group.id);
          const [first, ...rest] = items;
          return (
            <div key={group.id} className="space-y-10 border-t border-border/80 pt-10">
              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-4">
                  <p className="eyebrow">{String(groupIdx + 1).padStart(2, '0')} — {group.label}</p>
                  <h2 className="display-2 mt-3">{group.label}.</h2>
                </div>
                <p className="lede md:col-span-6 md:col-start-7">{group.intro}</p>
              </div>

              <div className="grid gap-px bg-border md:grid-cols-12">
                {first && (
                  <article className="bg-card p-8 md:col-span-7 md:p-10">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <first.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Featured
                      </span>
                    </div>
                    <h3 className="display-3 mt-6">{first.title}</h3>
                    <p className="lede mt-4 max-w-xl">{first.description}</p>
                  </article>
                )}
                <div className="grid gap-px bg-border md:col-span-5 md:grid-cols-1">
                  {rest.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article key={item.title} className="bg-card p-6">
                        <div className="flex items-start gap-4">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="font-serif text-lg tracking-[-0.014em]">{item.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-8 border-t border-border/80 pt-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">What varies by site</p>
          <h2 className="display-2 mt-4">A few things to know.</h2>
        </div>
        <div className="space-y-5 md:col-span-6 md:col-start-7">
          <p className="lede">
            Specific amenities differ by campground — water access is plentiful at Lake Haven and
            Bluewater, while Pine Ridge leans into trailheads and meadow views. Each campground
            page lists what is on-site.
          </p>
          <p className="lede">
            Fire pits, restrooms, and showers are available at all four locations. Wi-Fi is offered
            near lodges and stores rather than across every site, so evenings can stay quiet.
          </p>
          <div className="hairline pt-5 text-sm text-muted-foreground">
            Bringing a pet? Leashes are required in shared areas, and a few trails remain
            pet-free to protect wildlife.
          </div>
        </div>
      </section>
    </div>
  );
}