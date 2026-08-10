import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, MapPinned, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { listCampgroundSiteAvailability } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';

const typeColors: Record<SiteType, string> = { rv: 'border-primary bg-primary text-primary-foreground', tent: 'border-accent bg-accent text-accent-foreground', cabin: 'border-chart-3 bg-chart-3 text-white', glamping: 'border-chart-4 bg-chart-4 text-white' };
const occupiedStyle = 'border-dashed border-muted-foreground/60 bg-muted text-muted-foreground';

interface MapMarker {
  id: string;
  campsiteId?: string;
  name: string;
  type: SiteType;
  status: 'available' | 'occupied';
  x: number;
  y: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function InteractiveCampMap({ campgroundName, campgroundId }: { campgroundName: string; campgroundId?: string }) {
  const [type, setType] = useState<'all' | SiteType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveSites, setLiveSites] = useState<MapMarker[]>([]);
  const [arrival, setArrival] = useState(today());
  const [departure, setDeparture] = useState(daysFromNow(2));
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!campgroundId) {
      setLiveSites([]);
      return;
    }
    if (!arrival || !departure || departure <= arrival) {
      setLiveSites([]);
      setAvailabilityError('Choose a departure date after your arrival date.');
      return;
    }

    setLoading(true);
    setAvailabilityError(null);
    listCampgroundSiteAvailability({ campgroundId, arrival, departure })
      .then((data) => {
        const mapped: MapMarker[] = data.map((site, index) => ({
          id: String(site.siteNumber ?? site.id),
          campsiteId: String(site.id),
          name: String(site.name ?? site.siteNumber ?? ''),
          type: site.type as SiteType,
          status: site.status === 'occupied' ? 'occupied' : 'available',
          x: Number(site.mapCoordinates?.x ?? 20 + (index % 3) * 30),
          y: Number(site.mapCoordinates?.y ?? 28 + (Math.floor(index / 3) % 2) * 38),
        }));
        setLiveSites(mapped);
      })
      .catch(() => {
        setLiveSites([]);
        setAvailabilityError('We could not load site availability for these dates.');
      })
      .finally(() => setLoading(false));
  }, [campgroundId, arrival, departure, retryKey]);

  const sites = useMemo(() => {
    if (availabilityError || liveSites.length === 0) {
      return [];
    }
    return liveSites.filter((site) => type === 'all' || site.type === type);
  }, [liveSites, type, availabilityError]);

  const selected = sites.find((site) => site.id === selectedId);

  return <section id="camp-map" className="rounded-3xl border bg-card p-5 shadow-sm md:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Choose a spot</p><h2 className="mt-2 font-serif text-3xl tracking-tight">Interactive camp map</h2><p className="mt-2 text-sm text-muted-foreground">Pick your dates to see live availability at {campgroundName}.</p></div><div className="w-full sm:w-48"><label className="mb-2 block text-sm font-medium" htmlFor="map-type">Site type</label><Select value={type} onValueChange={(value) => setType(value as 'all' | SiteType)}><SelectTrigger id="map-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All site types</SelectItem>{Object.entries(siteCategories).map(([value, category]) => <SelectItem key={value} value={value}>{category.name}</SelectItem>)}</SelectContent></Select></div></div>

    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border bg-secondary/40 p-4">
      <div className="grid gap-2">
        <Label htmlFor="map-arrival">Arrival</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="map-arrival" type="date" min={today()} value={arrival} onChange={(event) => setArrival(event.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="map-departure">Departure</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="map-departure" type="date" min={arrival || today()} value={departure} onChange={(event) => setDeparture(event.target.value)} className="pl-9" />
        </div>
      </div>
      {loading && <span className="text-sm text-muted-foreground">Loading availability…</span>}
      {availabilityError && <span className="text-sm text-destructive">{availabilityError}</span>}
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
      <div className="relative min-h-[390px] overflow-hidden rounded-2xl border bg-secondary/45" aria-label="Campground site map">
        <div className="absolute -left-12 top-1/2 h-20 w-[115%] -rotate-6 rounded-full border-y-8 border-background/70 bg-chart-3/35" /><div className="absolute left-[9%] top-[12%] h-[72%] w-[76%] rounded-[45%] border border-primary/20 bg-primary/5" />
        <span className="absolute left-[12%] top-[11%] text-xs font-semibold text-muted-foreground">Pine trail</span><span className="absolute right-[10%] top-[15%] text-xs font-semibold text-muted-foreground">Camp lodge</span><span className="absolute right-[7%] bottom-[10%] text-xs font-semibold text-muted-foreground">Creek</span>
        <TooltipProvider>
          {availabilityError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="mb-3 text-sm text-destructive">{availabilityError}</p>
              <Button onClick={() => setRetryKey((k) => k + 1)} size="sm" variant="outline">Try again</Button>
            </div>
          ) : sites.length > 0 ? (
            sites.map((site) => {
              const isAvailable = site.status === 'available';
              const isSelected = selectedId === site.id;
              const isDimmed = type !== 'all' && site.type !== type;
              const marker = (
                <button
                  key={site.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedId(site.id)}
                  style={{ left: `${site.x}%`, top: `${site.y}%` }}
                  className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 text-xs font-bold shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${isAvailable ? typeColors[site.type] : occupiedStyle} ${isDimmed ? 'opacity-25 saturate-50' : ''} ${isSelected ? 'ring-4 ring-accent ring-offset-2' : ''}`}
                  aria-label={`${site.id}, ${siteCategories[site.type].name}, ${isAvailable ? 'available' : 'occupied'}`}
                >
                  {isAvailable ? <Check className="mx-auto h-4 w-4" /> : <X className="mx-auto h-4 w-4" />}
                  <span className="block text-[10px] leading-none">{site.id}</span>
                </button>
              );
              const label = isAvailable ? `${site.name} — available for your dates` : `${site.name} — not available for these dates`;
              return (
                <Tooltip key={site.id}>
                  <TooltipTrigger asChild>{marker}</TooltipTrigger>
                  <TooltipContent><p className="text-xs">{label}</p></TooltipContent>
                </Tooltip>
              );
            })
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{loading ? 'Loading availability…' : 'No sites available for these dates.'}</p>
            </div>
          )}
        </TooltipProvider>
      </div>
      <div className="space-y-5"><div><h3 className="font-semibold">Map key</h3><div className="mt-3 space-y-2 text-sm text-muted-foreground">{Object.entries(siteCategories).map(([key, category]) => <div key={key} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-sm ${typeColors[key as SiteType].split(' ').slice(1).join(' ')}`} />{category.name}</div>)}<div className="flex items-center gap-2"><span className="inline-flex h-3 w-3 items-center justify-center rounded-sm border border-dashed border-muted-foreground/60 bg-muted text-muted-foreground"><X className="h-2 w-2" /></span>Occupied for selected dates</div>{arrival && departure && departure > arrival && <p className="mt-2 text-xs text-muted-foreground">Showing availability {arrival} → {departure}</p>}</div></div>
        <div className="rounded-xl bg-muted p-4">
          {selected ? (
            <>
              <Badge variant={selected.status === 'available' ? 'secondary' : 'destructive'}>{selected.status === 'available' ? 'Available' : 'Occupied'}</Badge>
              <p className="mt-3 font-semibold">{selected.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {siteCategories[selected.type].name} · {arrival} → {departure}
              </p>
              {selected.status === 'available' && selected.campsiteId && campgroundId ? (
                <Button asChild className="mt-4 w-full" size="sm">
                  <Link to={`/reservation?campground=${campgroundId}&preferredSite=${selected.campsiteId}&checkIn=${arrival}&checkOut=${departure}`}><Check /> Reserve this site</Link>
                </Button>
              ) : selected.status === 'occupied' ? (
                <Button className="mt-4 w-full" size="sm" disabled><X /> Not available for these dates</Button>
              ) : (
                <Button className="mt-4 w-full" size="sm" disabled><Check /> Keep preference</Button>
              )}
            </>
          ) : (
            <>
              <MapPinned className="h-5 w-5 text-accent" />
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {availabilityError ? 'Unable to load site availability.' : loading ? 'Loading site availability…' : 'Tap any available colored site to choose it.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  </section>;
}