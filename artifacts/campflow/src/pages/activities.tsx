import { useMemo, useState } from 'react';
import { Compass, Fish, Flame, Kayak, Mountain, Stars, Trees, Waves } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ListingControls, { type ListingFilters } from '@/components/listing/ListingControls';
import PaginationControls from '@/components/listing/PaginationControls';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const activities = [
  { name: 'Hiking', description: 'Follow quiet forest paths, ridge walks, and family-friendly loops.', locations: ['Pine Ridge', 'Cedar Creek'], image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=85', icon: Mountain },
  { name: 'Fishing', description: 'Cast from calm shores, docks, and tucked-away creek banks.', locations: ['Lake Haven', 'Bluewater'], image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=85', icon: Fish },
  { name: 'Kayaking', description: 'Paddle at your own pace with launches and rentals at select sites.', locations: ['Lake Haven', 'Bluewater'], image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85', icon: Kayak },
  { name: 'Campfire nights', description: 'Gather for stories, s’mores, and easy company under the stars.', locations: ['Pine Ridge', 'Lake Haven', 'Bluewater', 'Cedar Creek'], image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=85', icon: Flame },
  { name: 'Nature walks', description: 'Slow down with guided walks that make room for curiosity.', locations: ['Bluewater', 'Cedar Creek'], image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=85', icon: Trees },
  { name: 'Stargazing', description: 'Look up from dark, open skies after the campfire burns low.', locations: ['Pine Ridge', 'Bluewater'], image: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=900&q=85', icon: Stars },
  { name: 'Creek exploring', description: 'Spend an afternoon finding skipping stones and small discoveries.', locations: ['Cedar Creek'], image: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=900&q=85', icon: Waves },
  { name: 'Scenic drives', description: 'Take the long way through mountain, lake, and river country.', locations: ['Pine Ridge', 'Lake Haven'], image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85', icon: Compass },
];

const spread = [
  { span: 'md:col-span-7 md:row-span-2 aspect-[4/3]', label: 'Wide hero' },
  { span: 'md:col-span-5 aspect-[4/3]', label: 'Companion' },
  { span: 'md:col-span-4 aspect-[4/3]', label: 'Quarter' },
  { span: 'md:col-span-4 aspect-[4/3]', label: 'Quarter' },
  { span: 'md:col-span-4 aspect-[4/3]', label: 'Quarter' },
  { span: 'md:col-span-6 aspect-[16/10]', label: 'Mid spread' },
  { span: 'md:col-span-6 aspect-[16/10]', label: 'Mid spread' },
  { span: 'md:col-span-12 aspect-[21/9]', label: 'Closing banner' },
];

export default function Activities() {
  usePageMetadata('Activities — CampFlow', 'Browse Green Valley outdoor activities, from hiking and kayaking to stargazing and campfire nights.');

  const [filters, setFilters] = useState<ListingFilters>({ query: '', sort: 'popularity' });
  const [page, setPage] = useState(1);

  const result = useMemo(
    () =>
      activities
        .filter((activity) =>
          `${activity.name} ${activity.locations.join(' ')}`.toLowerCase().includes(filters.query.toLowerCase()),
        )
        .sort((a, b) =>
          filters.sort === 'availability'
            ? a.locations.length - b.locations.length
            : a.name.localeCompare(b.name),
        ),
    [filters],
  );

  const perPage = 4;
  const visible = result.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="container-page space-y-16 pb-24 pt-12 md:space-y-24 md:pt-16">
      <section className="max-w-3xl">
        <p className="eyebrow">Field notes</p>
        <h1 className="display-1 mt-5">Days made for doing less, or more.</h1>
        <p className="lede mt-6">
          A field guide to the things people come to Green Valley to do — slow walks and long paddles,
          campfires and quiet hours, the kind of small adventures that stay with you.
        </p>
      </section>

      <section className="space-y-10 border-t border-border/80 pt-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Browse by mood</p>
            <h2 className="display-3 mt-3">Eight ways to spend a day.</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{visible.length}</span> of {result.length} activities
          </p>
        </div>

        <ListingControls
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          searchPlaceholder="Search activities or campground"
          sortOptions={[
            { value: 'popularity', label: 'A to Z' },
            { value: 'availability', label: 'Fewest locations' },
          ]}
        />

        <section id="listing" className="grid grid-cols-1 gap-6 md:grid-cols-12 md:auto-rows-[minmax(0,1fr)]">
          {visible.map(({ name, description, locations, image, icon: Icon }, idx) => {
            const layout = spread[idx % spread.length];
            const tall = layout.label === 'Wide hero' || layout.label === 'Closing banner';
            return (
              <article key={name} className={`${layout.span} ${tall ? 'md:row-span-2' : ''}`}>
                <Card className="group h-full overflow-hidden border-border bg-card">
                  <div className="relative h-full w-full">
                    <img
                      src={image}
                      alt={name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-white/80">
                          {locations.length} {locations.length === 1 ? 'campground' : 'campgrounds'}
                        </span>
                      </div>
                      <h3 className="mt-3 font-serif text-3xl tracking-[-0.018em] md:text-4xl">{name}</h3>
                      <p className="mt-3 max-w-md text-sm leading-6 text-white/85">{description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {locations.map((location) => (
                          <Badge key={location} variant="secondary" className="rounded-[2px] border border-white/30 bg-white/10 text-white hover:bg-white/20">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </article>
            );
          })}
        </section>

        {visible.length === 0 && (
          <div className="border border-dashed border-border bg-card p-12 text-center">
            <p className="eyebrow">Nothing matches</p>
            <h3 className="display-3 mt-3">No activities for that search.</h3>
            <p className="lede mx-auto mt-3 max-w-prose">Try a broader term — most folks start with a place, a season, or a pace.</p>
          </div>
        )}

        <PaginationControls page={page} totalPages={Math.ceil(result.length / perPage)} onPageChange={setPage} />
      </section>

      <section className="grid gap-8 border-t border-border/80 pt-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">A small invitation</p>
          <h2 className="display-2 mt-4">Pick one. Do it well.</h2>
        </div>
        <div className="space-y-5 md:col-span-6 md:col-start-7">
          <p className="lede">
            The activities on this page are meant to be a starting point, not a checklist. Choose the
            one that fits your day and let it be the whole day.
          </p>
          <p className="lede">
            Staff at each campground can help with gear, maps, and the best current spots — from
            quiet creek bends to open ridge lines after sunset.
          </p>
          <div className="hairline pt-5 text-sm text-muted-foreground">
            Available activities vary by campground and season. Check individual pages for the
            current list at each location.
          </div>
        </div>
      </section>
    </div>
  );
}