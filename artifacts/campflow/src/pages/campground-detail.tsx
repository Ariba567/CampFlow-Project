import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Heart, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CampsiteCategories from '@/components/campgrounds/CampsiteCategories';
import InteractiveCampMap from '@/components/campgrounds/InteractiveCampMap';
import { addFavorite, getCampground, listCampsites, listFavorites, removeFavorite, type ApiItem } from '@/services/customerDashboardService';
import { useAuth } from '@/context/AuthContext';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import type { SiteType } from '@/data/campgrounds';
import { campgroundImage } from '@/data/campground-images';
import { siteCategories } from '@/data/campgrounds';

const locationLabel = (campground: ApiItem) => [campground.address?.city, campground.address?.state].filter(Boolean).join(', ') || 'Location details available soon';
const campsiteTypes = (campground: ApiItem): SiteType[] => (campground.categories ?? campground.siteTypes ?? []) as SiteType[];
const idOf = (item: ApiItem) => String(item._id ?? item.id);

export default function CampgroundDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [campground, setCampground] = useState<ApiItem | null>(null);
  const [sites, setSites] = useState<ApiItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [filterType, setFilterType] = useState<SiteType | null>(null);

  usePageMetadata(campground ? `${campground.name} — CampFlow` : 'Campground details — CampFlow', 'Explore campground details, site availability, and amenities for your next stay.');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getCampground(slug)
      .then(async (campgroundData) => {
        setCampground(campgroundData);
        const [sitesData, favoritesResult] = await Promise.all([
          listCampsites(idOf(campgroundData)),
          isAuthenticated ? listFavorites().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);
        setSites(sitesData);
        setFavoriteIds(favoritesResult.data.map((item) => idOf(item)));
      })
      .catch(() => setError('We could not load campground details.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, slug]);

  const typeCounts = useMemo(() => sites.reduce<Record<string, number>>((counts, site) => ({ ...counts, [String(site.type ?? 'unknown')]: (counts[String(site.type ?? 'unknown')] ?? 0) + 1 }), {}), [sites]);

  // Site types that actually have at least one real campsite in this campground's inventory.
  // Falls back to the metadata-declared types while sites are still loading.
  const availableTypes = useMemo(() => {
    const fromInventory = [...new Set(sites.map((site) => String(site.type ?? '')))].filter(Boolean) as SiteType[];
    return fromInventory.length > 0 ? fromInventory : (campground ? campsiteTypes(campground) : []);
  }, [campground, sites]);

  const visibleSites = useMemo(() => filterType ? sites.filter((site) => String(site.type ?? '') === filterType) : sites, [filterType, sites]);

  const handleToggleFavorite = async (site: ApiItem) => {
    if (!isAuthenticated) { setFavoriteError('Sign in to save favorites.'); return; }
    const id = idOf(site);
    setSavingFavorite(true);
    setFavoriteError(null);
    try {
      if (favoriteIds.includes(id)) { await removeFavorite(id); setFavoriteIds((current) => current.filter((itemId) => itemId !== id)); }
      else { await addFavorite(id); setFavoriteIds((current) => [...current, id]); }
    } catch { setFavoriteError('Could not update favorites.'); }
    finally { setSavingFavorite(false); }
  };

  const handleExplore = (type: SiteType) => {
    setFilterType(type);
    const target = document.getElementById('where-to-stay');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="space-y-16 pb-10 md:space-y-24"><p className="text-sm text-muted-foreground">Loading campground...</p></div>;
  if (error || !campground) return <div className="space-y-16 pb-10 md:space-y-24"><p className="text-sm text-destructive">{error ?? 'Campground not found.'}</p></div>;

  const campgroundId = idOf(campground);
  return <div className="space-y-16 pb-10 md:space-y-24">
    <section><Button asChild variant="link" className="mb-5 px-0"><Link to="/campgrounds"><ArrowLeft />All campgrounds</Link></Button><div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground"><img src={campgroundImage(campground)} alt={campground.name} className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" /><div className="relative max-w-3xl px-6 py-16 md:px-12 md:py-24"><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75"><MapPin className="h-4 w-4" />{locationLabel(campground)}</p><h1 className="mt-4 font-serif text-5xl tracking-tight md:text-6xl">{campground.name}</h1><p className="mt-5 text-lg leading-8 text-primary-foreground/90">{campground.shortDescription}</p><Button asChild className="mt-8 bg-accent text-accent-foreground"><a href="#camp-map">Check availability <ArrowLeft className="rotate-180" /></a></Button></div></div></section>
    <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">About this campground</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Your basecamp for a better weekend.</h2><p className="mt-5 leading-8 text-muted-foreground">{campground.description}</p></div><Card><CardContent className="p-6"><h2 className="font-serif text-2xl">Included amenities</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{(campground.amenities ?? []).map((amenity: string) => <li key={amenity} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent" />{amenity}</li>)}</ul></CardContent></Card></section>
    <section><div className="mb-8 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Places to sleep</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Pick the stay that fits your trip.</h2></div><CampsiteCategories types={availableTypes} onExplore={handleExplore} /></section>
    <section id="where-to-stay"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Park map</p><h2 className="mt-3 font-serif text-4xl tracking-tight">Where to stay</h2></div><Badge variant="secondary">{sites.length} available sites</Badge></div>{filterType && <div className="mb-4 flex items-center gap-3"><Badge variant="secondary">Showing {siteCategories[filterType].name}</Badge><Button variant="link" className="px-0" onClick={() => setFilterType(null)}>Show all sites</Button></div>}{favoriteError && <p className="mb-4 text-sm text-destructive">{favoriteError}</p>}<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div className="grid gap-4 sm:grid-cols-2"><TooltipProvider>{visibleSites.length === 0 ? <div className="col-span-full py-10 text-center"><p className="text-sm text-muted-foreground">No {filterType ? siteCategories[filterType].name : 'sites'} available at this campground right now.</p><Button variant="link" className="px-0" onClick={() => setFilterType(null)}>Show all sites</Button></div> : visibleSites.map((site) => { const siteId = idOf(site); const isFavorite = favoriteIds.includes(siteId); return <Card key={siteId}><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{site.type ?? 'Site'} · {typeCounts[String(site.type ?? 'unknown')] ?? 0}</p><h3 className="mt-2 text-xl font-semibold">{site.name ?? `Site ${siteId}`}</h3></div><Tooltip><TooltipTrigger asChild><Button size="icon" variant={isFavorite ? 'secondary' : 'outline'} disabled={savingFavorite} onClick={() => void handleToggleFavorite(site)} aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}><Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} /></Button></TooltipTrigger><TooltipContent>{isFavorite ? 'Remove from favorites' : 'Save to favorites'}</TooltipContent></Tooltip></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{site.description ?? 'A comfortable place to unwind by the fire.'}</p></CardContent></Card>; })}</TooltipProvider></div><InteractiveCampMap campgroundName={campground.name} campgroundId={campgroundId} /></div></section>
  </div>;
}
