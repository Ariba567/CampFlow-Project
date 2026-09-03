import { useMemo, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const galleryItems = [
  { category: 'rv', title: 'Room to roll in', location: 'Pine Ridge, Colorado', image: 'https://images.unsplash.com/photo-1569134026343-a25e7b09e6ad?auto=format&fit=crop&w=1000&q=85' },
  { category: 'tents', title: 'Morning in the pines', location: 'Cedar Creek, Tennessee', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=85' },
  { category: 'cabins', title: 'Creekside cabin', location: 'Lake Haven, Michigan', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=85' },
  { category: 'activities', title: 'Quiet water, open day', location: 'Bluewater, Oregon', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=85' },
  { category: 'rv', title: 'Open road, open sky', location: 'Lake Haven, Michigan', image: 'https://images.unsplash.com/photo-1520190282873-9c6a3a3a4cda?auto=format&fit=crop&w=1000&q=85' },
  { category: 'tents', title: 'Campfire hour', location: 'Pine Ridge, Colorado', image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=85' },
  { category: 'cabins', title: 'A warm welcome', location: 'Cedar Creek, Tennessee', image: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1000&q=85' },
  { category: 'activities', title: 'Trail time', location: 'Pine Ridge, Colorado', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=85' },
];

const labels: Record<string, string> = {
  all: 'All',
  rv: 'RV',
  tents: 'Tents',
  cabins: 'Cabins',
  activities: 'Activities',
};

const layouts = [
  { className: 'md:col-span-8 md:row-span-2 aspect-[4/3]', label: 'Hero frame' },
  { className: 'md:col-span-4 aspect-[4/3]', label: 'Companion' },
  { className: 'md:col-span-4 aspect-[4/3]', label: 'Square' },
  { className: 'md:col-span-4 aspect-square', label: 'Tall' },
  { className: 'md:col-span-4 aspect-[4/3]', label: 'Square' },
  { className: 'md:col-span-6 aspect-[16/10]', label: 'Wide' },
  { className: 'md:col-span-6 aspect-[16/10]', label: 'Wide' },
  { className: 'md:col-span-12 aspect-[21/9]', label: 'Banner' },
];

export default function Gallery() {
  usePageMetadata(
    'Gallery — CampFlow',
    'Browse photo highlights of Green Valley campgrounds, cabins, and outdoor experiences.',
  );

  const [category, setCategory] = useState('all');
  const items = useMemo(
    () => galleryItems.filter((item) => category === 'all' || item.category === category),
    [category],
  );

  return (
    <div className="container-page space-y-16 pb-24 pt-12 md:space-y-24 md:pt-16">
      <section className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">Green Valley moments</p>
          <h1 className="display-1 mt-5">See yourself out here.</h1>
        </div>
        <p className="lede md:col-span-4 md:col-start-9">
          A look at the places, stays, and small adventures waiting across our four campgrounds —
          gathered from seasons on the road, the lake, and the trail.
        </p>
      </section>

      <section className="space-y-10 border-t border-border/80 pt-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              {Object.entries(labels).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-[2px] border border-transparent px-3 py-2 text-sm data-[state=active]:border-border data-[state=active]:bg-card"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'photo' : 'photos'} in this view
          </p>
        </div>

        {items.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(0,1fr)]">
            {items.map((item, idx) => {
              const layout = layouts[idx % layouts.length];
              return (
                <figure key={item.title} className={`${layout.className} group relative overflow-hidden bg-card`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-14 text-white">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-white/70">
                      {labels[item.category]}
                    </p>
                    <p className="mt-2 font-serif text-xl tracking-[-0.014em] md:text-2xl">{item.title}</p>
                    <p className="mt-1 text-sm text-white/80">{item.location}</p>
                  </figcaption>
                </figure>
              );
            })}
          </section>
        ) : (
          <div className="border border-dashed border-border bg-card p-12 text-center">
            <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="eyebrow mt-5">Empty frame</p>
            <h3 className="display-3 mt-3">No photos in this category yet.</h3>
            <p className="lede mx-auto mt-3 max-w-prose">Try another tab — most folks start with All.</p>
          </div>
        )}
      </section>

      <section className="grid gap-8 border-t border-border/80 pt-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">A note on these images</p>
          <h2 className="display-2 mt-4">Real places, real light.</h2>
        </div>
        <div className="space-y-5 md:col-span-6 md:col-start-7">
          <p className="lede">
            Every photo here was taken at one of our four campgrounds — no stock stand-ins. The
            goal is a useful preview, not a postcard.
          </p>
          <p className="lede">
            Conditions change with the seasons, so the cedar grove in summer looks different in
            late October. Use the categories above to narrow in on the kind of stay you have
            in mind.
          </p>
        </div>
      </section>
    </div>
  );
}