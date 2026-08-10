import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { idOf, type ApiItem } from '@/services/customerDashboardService';

interface ReviewListProps {
  reviews: ApiItem[];
  averageRating: number | null;
  totalReviews: number;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? 'fill-current text-accent' : 'text-muted-foreground/30'}`}
    />
  ));
}

function authorName(review: ApiItem): string {
  const customer = review.customer;
  if (!customer || typeof customer === 'string') return 'Anonymous';
  return customer.fullName || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email || 'Anonymous';
}

export default function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your stay.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-4xl font-bold">{averageRating !== null ? averageRating.toFixed(1) : '—'}</div>
        <div>
          <div className="flex items-center gap-1 text-accent">{renderStars(Math.round(averageRating ?? 0))}</div>
          <p className="text-sm text-muted-foreground">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={idOf(review)} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-accent">{renderStars(Number(review.rating ?? 0))}</div>
                  <span className="font-semibold">{authorName(review)}</span>
                </div>
                <time className="text-sm text-muted-foreground">
                  {String(review.createdAt ?? '').slice(0, 10)}
                </time>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {review.comment}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
