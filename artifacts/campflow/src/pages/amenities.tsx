import { Bath, Dog, Flame, ShowerHead, ShoppingBag, Trees, Wifi, Waves } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const amenities = [
  { title: 'Clean restrooms', description: 'Well-maintained facilities close to every camping loop.', icon: Bath }, { title: 'Hot showers', description: 'Private, hot showers for a comfortable reset after the trail.', icon: ShowerHead },
  { title: 'Wi-Fi zones', description: 'Reliable connection around our lodges and camp stores.', icon: Wifi }, { title: 'Pet-friendly areas', description: 'Room for leashed dogs to stretch, sniff, and settle in.', icon: Dog },
  { title: 'Fire pits', description: 'A classic fire ring or pit at most sites, with wood nearby.', icon: Flame }, { title: 'General stores', description: 'Ice, firewood, essentials, and local snacks when you need them.', icon: ShoppingBag },
  { title: 'Nature trails', description: 'Easy walks and longer routes right from your campground.', icon: Trees }, { title: 'Water access', description: 'Lakes, creeks, or paddle launches at select Green Valley locations.', icon: Waves },
];

export default function Amenities() { return <div className="space-y-12 pb-10 md:space-y-16"><section className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Thoughtful essentials</p><h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Comforts that let you stay outside longer.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Every Green Valley location has its own character, with shared amenities designed to make camping simple and comfortable.</p></section><section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{amenities.map(({ title, description, icon: Icon }) => <Card key={title}><CardContent className="p-6"><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}</section></div>; }
