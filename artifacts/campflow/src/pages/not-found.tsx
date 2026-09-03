import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageMetadata } from '@/hooks/usePageMetadata';

export default function NotFound() {
  usePageMetadata('404 — CampFlow', 'The page you were looking for could not be found.');
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20">
      <div className="grid w-full max-w-3xl items-center gap-10 md:grid-cols-[auto_1fr]">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-primary md:h-32 md:w-32">
          <Compass className="h-10 w-10 md:h-14 md:w-14" />
        </div>
        <div>
          <p className="eyebrow">404 — Off the trail</p>
          <h1 className="display-1 mt-3">We can't find that page.</h1>
          <p className="lede mt-5 max-w-xl">
            The page you were looking for either moved or never existed. Head back to the campgrounds to start
            a new search.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/campgrounds">Browse campgrounds <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}