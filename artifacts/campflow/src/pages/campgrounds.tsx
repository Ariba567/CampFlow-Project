import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampsiteCategories from '@/components/campgrounds/CampsiteCategories';
import { listCampgrounds, type ApiItem } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { usePageMetadata } from '@/hooks/usePageMetadata';

export default function Campgrounds() {
  const [location, setLocation] = useState('all');
  const [siteType, setSiteType] = useState<'all' | SiteType>('all');
  usePageMetadata('Campgrounds — CampFlow', 'Browse Green Valley campgrounds with filters for location and campsite type.');

  const {
    data: campgrounds,
    loading,
    error,
  } = useAsyncResource<ApiItem[]>(() => listCampgrounds(), []);

  const filtered = useMemo(
    () => (campgrounds ?? []).filter((campground) =>
      (location === 'all' || String(campground.location).includes(location)) &&
      (siteType === 'all' || (campground.siteTypes ?? []).includes(siteType)),
    ),
    [campgrounds, location, siteType],
  );

  return <div className="space-y-16 pb-10 md:space-y-24">
    <section className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Four places to stay</p><h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Find your corner of the outdoors.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Each Green Valley campground has its own character, from lakeside days to quiet mountain mornings.</p></section>
    <section><div className="mb-7 flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end"><div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4 text-accent" />Filter locations</div><div className="grid flex-1 gap-3 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-medium" htmlFor="location-filter">Location</label><Select value={location} onValueChange={setLocation}><SelectTrigger id="location-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All locations</SelectItem><SelectItem value="Colorado">Colorado</SelectItem><SelectItem value="Michigan">Michigan</SelectItem><SelectItem value="Oregon">Oregon</SelectItem><SelectItem value="Tennessee">Tennessee</SelectItem></SelectContent></Select></div><div><label className="mb-2 block text-xs font-medium" htmlFor="site-filter">Site type</label><Select value={siteType} onValueChange={(value) => setSiteType(value as 'all' | SiteType)}><SelectTrigger id="site-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All site types</SelectItem>{Object.entries(siteCategories).map(([value, category]) => <SelectItem key={value} value={value}>{category.name}</SelectItem>)}</SelectContent></Select></div></div></div>
      {loading ? <p className="text-sm text-muted-foreground">Loading campgrounds…</p> : error ? <p className="text-sm text-destructive">{error}</p> : <p className="mb-5 text-sm text-muted-foreground">Showing {filtered.length} of {campgrounds?.length ?? 0} campgrounds</p>}<div className="grid gap-6 md:grid-cols-2">{filtered.map((campground) => <Card key={campground.slug} className="overflow-hidden"><img src={campground.image} alt={campground.name} className="h-56 w-full object-cover" loading="lazy" /><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-3xl tracking-tight">{campground.name}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-accent" />{campground.location}</p></div><Badge variant="secondary">{campground.totalSites} sites</Badge></div><p className="mt-4 leading-7 text-muted-foreground">{campground.shortDescription}</p><div className="mt-5 flex flex-wrap gap-2">{(campground.siteTypes ?? []).map((siteType: SiteType) => <Badge key={siteType} variant="outline">{siteCategories[siteType]?.name ?? siteType}</Badge>)}</div><Button asChild variant="link" className="mt-4 px-0"><Link to={`/campgrounds/${campground.slug}`}>View details <ArrowRight /></Link></Button></CardContent></Card>)}</div>
    </section>
    <section><div className="mb-8 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Stay your way</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Choose your kind of camp.</h2></div><CampsiteCategories /></section>
  </div>;
}
