import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ListingFilters = { query: string; siteType?: string; priceRange?: string; amenity?: string; sort: string };
export type ListingOption = { value: string; label: string };

interface ListingControlsProps {
  value: ListingFilters;
  onChange: (value: ListingFilters) => void;
  searchPlaceholder?: string;
  siteTypes?: ListingOption[];
  priceRanges?: ListingOption[];
  amenities?: ListingOption[];
  sortOptions?: ListingOption[];
}

export default function ListingControls({ value, onChange, searchPlaceholder = 'Search by keyword or location', siteTypes, priceRanges, amenities, sortOptions = [{ value: 'popularity', label: 'Most popular' }, { value: 'price-low', label: 'Price: low to high' }, { value: 'price-high', label: 'Price: high to low' }, { value: 'availability', label: 'Availability' }] }: ListingControlsProps) {
  const update = (key: keyof ListingFilters, next: string) => onChange({ ...value, [key]: next });
  const select = (id: string, label: string, current: string | undefined, values: ListingOption[] | undefined, key: keyof ListingFilters) => values?.length ? <div><label className="mb-2 block text-xs font-medium" htmlFor={id}>{label}</label><Select value={current ?? 'all'} onValueChange={(next) => update(key, next)}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {label.toLowerCase()}s</SelectItem>{values.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div> : null;
  return <div className="rounded-2xl border bg-card p-4 shadow-sm"><div className="grid gap-4 lg:grid-cols-[1.5fr_repeat(4,minmax(130px,1fr))]"><div><label className="mb-2 flex items-center gap-2 text-xs font-medium" htmlFor="listing-search"><Search className="h-3.5 w-3.5 text-accent" />Search</label><Input id="listing-search" value={value.query} onChange={(event) => update('query', event.target.value)} placeholder={searchPlaceholder} /></div>{select('listing-site-type', 'Site type', value.siteType, siteTypes, 'siteType')}{select('listing-price', 'Price range', value.priceRange, priceRanges, 'priceRange')}{select('listing-amenity', 'Amenity', value.amenity, amenities, 'amenity')}<div><label className="mb-2 flex items-center gap-2 text-xs font-medium" htmlFor="listing-sort"><SlidersHorizontal className="h-3.5 w-3.5 text-accent" />Sort by</label><Select value={value.sort} onValueChange={(next) => update('sort', next)}><SelectTrigger id="listing-sort"><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div></div>;
}
