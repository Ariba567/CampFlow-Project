import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PagePlaceholder from '@/components/common/PagePlaceholder';
import { usePageMetadata } from '@/hooks/usePageMetadata';

export default function CampsiteDetail() {
  const { siteId } = useParams();
  usePageMetadata(
    siteId ? `Campsite ${siteId} — CampFlow` : 'Campsite details — CampFlow',
    'Individual campsite details are coming to CampFlow soon. Browse a campground to see all of its sites today.',
  );
  return (
    <div className="container-page space-y-10 py-10">
      <Button asChild variant="link" className="h-auto px-0 text-foreground/80 hover:text-foreground">
        <Link to="/campgrounds"><ArrowLeft /> All campgrounds</Link>
      </Button>
      <header className="max-w-3xl">
        <p className="eyebrow flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Campsite</p>
        <h1 className="display-1 mt-3">Campsite details</h1>
        <p className="lede mt-5 max-w-2xl">
          Individual campsite profiles are being expanded across CampFlow. In the meantime, every campground page
          lists the sites available for your chosen dates with pricing, capacity, and amenities.
        </p>
      </header>
      <PagePlaceholder title="Campsite Detail" />
      <div>
        <Button asChild>
          <Link to="/campgrounds">Browse campgrounds</Link>
        </Button>
      </div>
    </div>
  );
}