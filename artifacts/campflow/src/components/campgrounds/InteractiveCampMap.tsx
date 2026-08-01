import { useMemo, useState } from 'react';
import { Check, MapPinned } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mapSites, siteCategories, type SiteType } from '@/data/campgrounds';

const typeColors: Record<SiteType, string> = { rv: 'border-primary bg-primary text-primary-foreground', tent: 'border-accent bg-accent text-accent-foreground', cabin: 'border-chart-3 bg-chart-3 text-white', glamping: 'border-chart-4 bg-chart-4 text-white' };

export default function InteractiveCampMap({ campgroundName }: { campgroundName: string }) {
  const [type, setType] = useState<'all' | SiteType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sites = useMemo(() => mapSites.filter((site) => type === 'all' || site.type === type), [type]);
  const selected = mapSites.find((site) => site.id === selectedId);

  return <section id="camp-map" className="rounded-3xl border bg-card p-5 shadow-sm md:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Choose a spot</p><h2 className="mt-2 font-serif text-3xl tracking-tight">Interactive camp map</h2><p className="mt-2 text-sm text-muted-foreground">Explore a sample layout for {campgroundName}. Select an available site to hold your preference.</p></div><div className="w-full sm:w-48"><label className="mb-2 block text-sm font-medium" htmlFor="map-type">Site type</label><Select value={type} onValueChange={(value) => setType(value as 'all' | SiteType)}><SelectTrigger id="map-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All site types</SelectItem>{Object.entries(siteCategories).map(([value, category]) => <SelectItem key={value} value={value}>{category.name}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
      <div className="relative min-h-[390px] overflow-hidden rounded-2xl border bg-secondary/45" aria-label="Campground site map">
        <div className="absolute -left-12 top-1/2 h-20 w-[115%] -rotate-6 rounded-full border-y-8 border-background/70 bg-chart-3/35" /><div className="absolute left-[9%] top-[12%] h-[72%] w-[76%] rounded-[45%] border border-primary/20 bg-primary/5" />
        <span className="absolute left-[12%] top-[11%] text-xs font-semibold text-muted-foreground">Pine trail</span><span className="absolute right-[10%] top-[15%] text-xs font-semibold text-muted-foreground">Camp lodge</span><span className="absolute right-[7%] bottom-[10%] text-xs font-semibold text-muted-foreground">Creek</span>
        {sites.map((site) => <button key={site.id} type="button" disabled={site.status === 'occupied'} onClick={() => setSelectedId(site.id)} style={{ left: `${site.x}%`, top: `${site.y}%` }} className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 text-xs font-bold shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${typeColors[site.type]} ${selectedId === site.id ? 'ring-4 ring-accent ring-offset-2' : ''}`} aria-label={`${site.id}, ${siteCategories[site.type].name}, ${site.status}`}>{site.id}</button>)}
      </div>
      <div className="space-y-5"><div><h3 className="font-semibold">Map key</h3><div className="mt-3 space-y-2 text-sm text-muted-foreground">{Object.entries(siteCategories).map(([key, category]) => <div key={key} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-sm ${typeColors[key as SiteType].split(' ').slice(1).join(' ')}`} />{category.name}</div>)}<div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-muted-foreground/45" />Occupied</div></div></div>
        <div className="rounded-xl bg-muted p-4">{selected ? <><Badge variant="secondary">Selected site</Badge><p className="mt-3 font-semibold">{selected.id} · {siteCategories[selected.type].name}</p><p className="mt-1 text-sm text-muted-foreground">Available for your preferred stay.</p><Button className="mt-4 w-full" size="sm"><Check /> Keep preference</Button></> : <><MapPinned className="h-5 w-5 text-accent" /><p className="mt-2 text-sm leading-6 text-muted-foreground">Tap any available colored site to choose it.</p></>}</div>
      </div>
    </div>
  </section>;
}
