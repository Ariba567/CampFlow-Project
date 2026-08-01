import { BedDouble, Caravan, TentTree, Trees } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { siteCategories, type SiteType } from '@/data/campgrounds';

const icons = { rv: Caravan, tent: TentTree, cabin: BedDouble, glamping: Trees };

export default function CampsiteCategories({ types = Object.keys(siteCategories) as SiteType[] }: { types?: SiteType[] }) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {types.map((type) => { const category = siteCategories[type]; const Icon = icons[type]; return <Card key={type} className="overflow-hidden"><img src={category.image} alt={category.name} className="h-40 w-full object-cover" /><CardContent className="p-5"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-accent" /><h3 className="font-semibold">{category.name}</h3></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p></CardContent></Card>; })}
  </div>;
}
