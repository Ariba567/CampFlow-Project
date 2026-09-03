import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, MapPinned, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { listCampgroundSiteAvailability } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';

const typeColors: Record<SiteType, string> = {
  rv: 'border-primary bg-primary text-primary-foreground',
  tent: 'border-accent bg-accent text-accent-foreground',
  cabin: 'border-chart-3 bg-chart-3 text-white',
  glamping: 'border-chart-4 bg-chart-4 text-white',
};

const occupiedStyle = 'border-dashed border-muted-foreground/60 bg-muted/60 text-muted-foreground';

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
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

interface InteractiveCampMapProps {
  campgroundName: string;
  campgroundId?: string;
  initialArrival?: string;
  initialDeparture?: string;
}

export default function InteractiveCampMap({
  campgroundName,
  campgroundId,
  initialArrival,
  initialDeparture,
}: InteractiveCampMapProps) {
  const [type, setType] = useState<'all' | SiteType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveSites, setLiveSites] = useState<MapMarker[]>([]);
  const [arrival, setArrival] = useState(initialArrival ?? today());
  const [departure, setDeparture] = useState(initialDeparture ?? addDays(2));
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (initialArrival) setArrival(initialArrival);
    if (initialDeparture) setDeparture(initialDeparture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArrival, initialDeparture]);

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
          x: Number(site.mapCoordinates?.x ?? 18 + (index % 5) * 16),
          y: Number(site.mapCoordinates?.y ?? 28 + Math.floor(index / 5) * 18),
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
    if (availabilityError || liveSites.length === 0) return [];
    return liveSites.filter((site) => type === 'all' || site.type === type);
  }, [liveSites, type, availabilityError]);

  const selected = sites.find((site) => site.id === selectedId);
  const availableCount = liveSites.filter((site) => site.status === 'available').length;
  const occupiedCount = liveSites.filter((site) => site.status === 'occupied').length;

  return (
    <div className="border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Live availability</p>
          <p className="mt-1 font-serif text-lg text-foreground">
            {arrival} <span className="mx-1 text-muted-foreground">→</span> {departure}
          </p>
        </div>
        <div className="w-full sm:w-44">
          <Label htmlFor="map-type" className="sr-only">
            Site type
          </Label>
          <Select value={type} onValueChange={(value) => setType(value as 'all' | SiteType)}>
            <SelectTrigger id="map-type" className="h-10 rounded-none border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All site types</SelectItem>
              {Object.entries(siteCategories).map(([value, category]) => (
                <SelectItem key={value} value={value}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border bg-secondary/30 p-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="map-arrival" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Arrival
          </Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <Input id="map-arrival" type="date" min={today()} value={arrival} onChange={(event) => setArrival(event.target.value)} className="h-10 rounded-none border-border bg-card pl-9" />
          </div>
        </div>
        <div>
          <Label htmlFor="map-departure" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Departure
          </Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <Input id="map-departure" type="date" min={arrival || today()} value={departure} onChange={(event) => setDeparture(event.target.value)} className="h-10 rounded-none border-border bg-card pl-9" />
          </div>
        </div>
      </div>

      {liveSites.length > 0 && !availabilityError && (
        <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85">
            <span className="size-2 rounded-full bg-accent" />
            {availableCount} open
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-muted-foreground/50" />
            {occupiedCount} occupied
          </span>
          <span className="ml-auto hidden text-muted-foreground sm:inline">Tap any open site to reserve</span>
        </div>
      )}

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <div className="relative min-h-[360px] overflow-hidden border border-border bg-card" aria-label={`${campgroundName} site map`}>
          <div className="absolute -left-12 top-1/2 h-20 w-[115%] -rotate-6 rounded-full border-y-8 border-background/70 bg-chart-3/35" />
          <div className="absolute left-[9%] top-[12%] h-[72%] w-[76%] rounded-[45%] border border-primary/20 bg-primary/5" />
          <span className="absolute left-[12%] top-[11%] text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pine trail</span>
          <span className="absolute right-[10%] top-[15%] text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Camp lodge</span>
          <span className="absolute right-[7%] bottom-[10%] text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Creek</span>

          <TooltipProvider>
            {availabilityError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-6 text-center">
                <p className="mb-3 text-sm text-muted-foreground">{availabilityError}</p>
                <Button onClick={() => setRetryKey((k) => k + 1)} size="sm" variant="outline" className="rounded-none">
                  Try again
                </Button>
              </div>
            ) : sites.length > 0 ? (
              sites.map((site) => {
                const isAvailable = site.status === 'available';
                const isSelected = selectedId === site.id;
                const marker = (
                  <button
                    key={site.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedId(site.id)}
                    style={{ left: `${site.x}%`, top: `${site.y}%` }}
                    className={`absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 border text-[10px] font-bold transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ${
                      isAvailable ? typeColors[site.type] : occupiedStyle
                    } ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}`}
                    aria-label={`${site.id}, ${siteCategories[site.type].name}, ${isAvailable ? 'available' : 'occupied'}`}
                  >
                    {isAvailable ? <Check className="mx-auto h-3.5 w-3.5" /> : <X className="mx-auto h-3.5 w-3.5" />}
                    <span className="block leading-none">{site.id}</span>
                  </button>
                );
                const label = isAvailable ? `${site.name} — available for your dates` : `${site.name} — not available for these dates`;
                return (
                  <Tooltip key={site.id}>
                    <TooltipTrigger asChild>{marker}</TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <p className="text-sm text-muted-foreground">{loading ? 'Loading availability…' : 'No sites available for these dates.'}</p>
              </div>
            )}
          </TooltipProvider>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Map key</p>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(siteCategories).map(([key, category]) => (
                <li key={key} className="flex items-center gap-2 text-foreground">
                  <span className={`h-3 w-3 ${typeColors[key as SiteType].split(' ').slice(1).join(' ')}`} />
                  {category.name}
                </li>
              ))}
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-flex h-3 w-3 items-center justify-center border border-dashed border-muted-foreground/60 bg-muted text-muted-foreground">
                  <X className="h-2 w-2" />
                </span>
                Occupied for selected dates
              </li>
            </ul>
          </div>

          <div className="border border-border bg-card p-4">
            {selected ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Site {selected.id}
                </p>
                <p className="mt-2 font-serif text-lg text-foreground">{selected.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinned className="h-3 w-3 text-accent" />
                  {siteCategories[selected.type].name}
                </p>
                <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${selected.status === 'available' ? 'text-accent' : 'text-muted-foreground'}`}>
                  <span className={`size-1.5 rounded-full ${selected.status === 'available' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                  {selected.status === 'available' ? 'Available for your dates' : 'Occupied for these dates'}
                </p>
                {selected.status === 'available' && selected.campsiteId && campgroundId ? (
                  <Button asChild className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                    <Link to={`/reservation?campground=${campgroundId}&preferredSite=${selected.campsiteId}&checkIn=${arrival}&checkOut=${departure}`}>
                      Reserve this site
                    </Link>
                  </Button>
                ) : selected.status === 'occupied' ? (
                  <Button className="mt-4 w-full bg-muted text-muted-foreground" size="sm" disabled>
                    Not available
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Selection</p>
                <MapPinned className="mt-3 h-5 w-5 text-accent" />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {availabilityError
                    ? 'Unable to load site availability.'
                    : loading
                      ? 'Loading site availability…'
                      : 'Tap any open site on the map to see details and reserve.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}