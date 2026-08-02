import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listCampgrounds, type ApiItem } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';

export default function Categories() {
  const { type } = useParams();
  const categoryType = type as SiteType | undefined;
  const category = categoryType ? siteCategories[categoryType] : undefined;
  const [campgrounds, setCampgrounds] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listCampgrounds()
      .then(setCampgrounds)
      .catch(() => setError('We could not load campgrounds.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCampgrounds = useMemo(
    () => campgrounds.filter((campground) => (categoryType ? (campground.siteTypes ?? []).includes(categoryType) : true)),
    [campgrounds, categoryType],
  );

  if (!categoryType || !category) {
    return <div className="space-y-8 pb-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Category not found</p><h1 className="mt-3 font-serif text-4xl tracking-tight">This campsite category is unavailable.</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">Choose a different campsite type from the campground listings.</p></div>;
  }

  return (
    <div className="space-y-14 pb-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{category.name}</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Explore {category.name.toLowerCase()} stays.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{category.description}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {filteredCampgrounds.map((campground) => (
          <Card key={campground.slug} className="overflow-hidden">
            <img src={campground.image} alt={campground.name} className="h-56 w-full object-cover" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">{campground.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{campground.location}</p>
                </div>
                <Badge variant="secondary">{category.name}</Badge>
              </div>
              <p className="mt-5 leading-7 text-muted-foreground">{campground.shortDescription}</p>
              <div className="mt-6 flex justify-end">
                <Button asChild variant="link" className="px-0">
                  <a href={`/campgrounds/${campground.slug}`}>View details <ArrowRight /></a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading campgrounds…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && filteredCampgrounds.length === 0 && (
        <p className="text-sm text-muted-foreground">No campgrounds currently offer this site type.</p>
      )}
    </div>
  );
}
