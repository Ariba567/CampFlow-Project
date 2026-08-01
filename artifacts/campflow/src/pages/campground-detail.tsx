import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CampsiteCategories from '@/components/campgrounds/CampsiteCategories';
import InteractiveCampMap from '@/components/campgrounds/InteractiveCampMap';
import { campgrounds } from '@/data/campgrounds';

export default function CampgroundDetail() {
  const { slug } = useParams(); const campground = campgrounds.find((item) => item.slug === slug) ?? campgrounds[0];
  return <div className="space-y-16 pb-10 md:space-y-24">
    <section><Button asChild variant="link" className="mb-5 px-0"><Link to="/campgrounds"><ArrowLeft />All campgrounds</Link></Button><div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground"><img src={campground.image} alt={campground.name} className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" /><div className="relative max-w-3xl px-6 py-16 md:px-12 md:py-24"><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75"><MapPin className="h-4 w-4" />{campground.location}</p><h1 className="mt-4 font-serif text-5xl tracking-tight md:text-6xl">{campground.name}</h1><p className="mt-5 text-lg leading-8 text-primary-foreground/90">{campground.shortDescription}</p><Button asChild className="mt-8 bg-accent text-accent-foreground"><a href="#camp-map">Check availability <ArrowLeft className="rotate-180" /></a></Button></div></div></section>
    <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">About this campground</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Your basecamp for a better weekend.</h2><p className="mt-5 leading-8 text-muted-foreground">{campground.description}</p></div><Card><CardContent className="p-6"><h2 className="font-serif text-2xl">Included amenities</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{campground.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent" />{amenity}</li>)}</ul></CardContent></Card></section>
    <section><div className="mb-8 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Places to sleep</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Pick the stay that fits your trip.</h2></div><CampsiteCategories types={campground.siteTypes} /></section>
    <section><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">A closer look</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Around {campground.name}</h2></div><Badge variant="secondary">{campground.totalSites} total sites</Badge></div><div className="grid gap-4 md:grid-cols-3">{campground.gallery.map((image, index) => <img key={image} src={image} alt={`${campground.name} view ${index + 1}`} className="h-64 w-full rounded-2xl object-cover" />)}</div></section>
    <InteractiveCampMap campgroundName={campground.name} />
  </div>;
}
