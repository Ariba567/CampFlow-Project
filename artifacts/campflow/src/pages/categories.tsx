import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listCampgrounds, type ApiItem } from '@/services/customerDashboardService';
import { siteCategories, type SiteType } from '@/data/campgrounds';
import { campgroundImage } from '@/data/campground-images';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const campsiteTypes = (campground: ApiItem): SiteType[] => (campground.categories ?? campground.siteTypes ?? []) as SiteType[];
const locationLabel = (campground: ApiItem) =>
  [campground.address?.city, campground.address?.state].filter(Boolean).join(', ') || 'Location details available soon';

export default function Categories() {
  const { type } = useParams();
  const categoryType = type as SiteType | undefined;
  const category = categoryType ? siteCategories[categoryType] : undefined;

  usePageMetadata(
    category ? `${category.name} camping category — CampFlow` : 'Category not found — CampFlow',
    category
      ? `Explore campgrounds offering ${category.name.toLowerCase()} stays at CampFlow.`
      : 'Category not found for CampFlow campsites.',
  );

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
    () => campgrounds.filter((campground) => !categoryType || campsiteTypes(campground).includes(categoryType)),
    [campgrounds, categoryType],
  );

  if (!categoryType || !category) {
    return (
      <div className="container-page space-y-10 pb-24 pt-12 md:pt-16">
        <section className="max-w-3xl">
          <p className="eyebrow">Category not found</p>
          <h1 className="display-1 mt-5">This campsite category is unavailable.</h1>
          <p className="lede mt-6">
            Choose a different campsite type from the campground listings to keep exploring.
          </p>
        </section>
        <div className="border-t border-border/80 pt-8">
          <Button asChild variant="outline" className="rounded-[2px]">
            <Link to="/campgrounds">All campgrounds</Link>
          </Button>
        </div>
      </div>
    );
  }

  const featured = filteredCampgrounds[0];
  const rest = filteredCampgrounds.slice(1);

  return (
    <div className="container-page space-y-24 pb-24 pt-12 md:space-y-32 md:pt-16">
      <section className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">{category.name}</p>
          <h1 className="display-1 mt-5">Explore {category.name.toLowerCase()} stays.</h1>
        </div>
        <p className="lede md:col-span-4 md:col-start-9">{category.description}</p>
      </section>

      <section className="flex flex-wrap items-center gap-3 border-y border-border/80 py-5 text-sm text-muted-foreground">
        <span className="eyebrow !text-muted-foreground">
          {filteredCampgrounds.length} {filteredCampgrounds.length === 1 ? 'campground' : 'campgrounds'}
        </span>
        <span aria-hidden className="text-border">·</span>
        <span>Curated for {category.name.toLowerCase()} travelers</span>
        <span aria-hidden className="text-border">·</span>
        <span>Across the Green Valley collection</span>
      </section>

      {featured && (
        <section>
          <p className="eyebrow">Editor's pick</p>
          <h2 className="display-2 mt-3">Start with this one.</h2>
          <article className="mt-8 grid gap-10 md:grid-cols-12">
            <Link to={`/campgrounds/${featured.slug}`} className="editorial-figure group block md:col-span-7">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={campgroundImage(featured)}
                  alt={featured.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
            </Link>
            <div className="flex flex-col justify-between md:col-span-5">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{locationLabel(featured)}</span>
                </div>
                <h3 className="display-2 mt-4">
                  <Link to={`/campgrounds/${featured.slug}`} className="hover:text-primary">
                    {featured.name}
                  </Link>
                </h3>
                <p className="lede mt-5">{featured.shortDescription}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {campsiteTypes(featured).map((t) => (
                    <Badge key={t} variant="outline" className="rounded-[2px] border-border font-normal tracking-normal">
                      {siteCategories[t]?.name ?? t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex items-end justify-end border-t border-border/80 pt-6">
                <Link
                  to={`/campgrounds/${featured.slug}`}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent"
                >
                  View campground
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-end justify-between border-t border-border/80 pt-10">
            <div>
              <p className="eyebrow">More {category.name.toLowerCase()} options</p>
              <h2 className="display-2 mt-3">And a handful more.</h2>
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">
              {rest.length} more {rest.length === 1 ? 'stay' : 'stays'}
            </p>
          </div>

          <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
            {rest.map((campground) => (
              <article key={campground.slug} className="group flex flex-col">
                <Link to={`/campgrounds/${campground.slug}`} className="editorial-figure block">
                  <div className="aspect-[5/4] overflow-hidden">
                    <img
                      src={campgroundImage(campground)}
                      alt={campground.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </Link>
                <div className="mt-6 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span>{locationLabel(campground)}</span>
                </div>
                <h3 className="display-3 mt-3">
                  <Link to={`/campgrounds/${campground.slug}`} className="hover:text-primary">
                    {campground.name}
                  </Link>
                </h3>
                <p className="lede mt-3 line-clamp-3">{campground.shortDescription}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {campsiteTypes(campground).map((t) => (
                    <Badge key={t} variant="outline" className="rounded-[2px] border-border font-normal tracking-normal">
                      {siteCategories[t]?.name ?? t}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <Button asChild variant="link" className="px-0 text-primary hover:text-accent">
                    <Link to={`/campgrounds/${campground.slug}`}>
                      View details
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Loading campgrounds...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && filteredCampgrounds.length === 0 && (
        <section className="border-t border-border/80 pt-12 text-center">
          <p className="eyebrow">A quiet stretch</p>
          <h2 className="display-3 mt-3">No campgrounds currently offer this site type.</h2>
          <p className="lede mx-auto mt-3 max-w-prose">
            We add new locations each season — check back soon, or browse all campgrounds for what
            is available now.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline" className="rounded-[2px]">
              <Link to="/campgrounds">All campgrounds</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}