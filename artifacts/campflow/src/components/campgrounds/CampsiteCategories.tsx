import { BedDouble, Caravan, TentTree, Trees } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { siteCategories, type SiteType } from '@/data/campgrounds';

const icons = { rv: Caravan, tent: TentTree, cabin: BedDouble, glamping: Trees };

export default function CampsiteCategories({
  types = Object.keys(siteCategories) as SiteType[],
  onExplore,
}: {
  types?: SiteType[];
  onExplore?: (type: SiteType) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {types.map((type) => {
        const category = siteCategories[type];
        const Icon = icons[type];
        return (
          <article key={type} className="group">
            <div className="relative aspect-[4/5] overflow-hidden bg-card">
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
              <div className="absolute left-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm">
                <Icon className="h-4 w-4" />
              </div>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="font-serif text-2xl font-medium tracking-[-0.01em]">{category.name}</p>
                <p className="mt-1 text-xs leading-5 text-white/85">{category.description}</p>
              </div>
            </div>
            <div className="mt-4">
              {onExplore ? (
                <Button variant="link" className="h-auto px-0 text-foreground" onClick={() => onExplore(type)}>
                  Explore {category.name.toLowerCase()}
                </Button>
              ) : (
                <Button asChild variant="link" className="h-auto px-0 text-foreground">
                  <Link to={`/categories/${type}`}>Explore {category.name.toLowerCase()}</Link>
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}