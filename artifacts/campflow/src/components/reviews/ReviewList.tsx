import { Star } from 'lucide-react';
import { idOf, type ApiItem } from '@/services/customerDashboardService';

interface ReviewListProps {
  reviews: ApiItem[];
  averageRating: number | null;
  totalReviews: number;
}

function renderStars(rating: number, size: 'sm' | 'md' = 'sm') {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`${sizeClass} ${i < rating ? 'fill-current text-accent' : 'text-muted-foreground/25'}`}
    />
  ));
}

function authorName(review: ApiItem): string {
  const customer = review.customer;
  if (!customer || typeof customer === 'string') return 'Anonymous';
  return customer.fullName || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email || 'Anonymous';
}

function authorInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export default function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="border border-border/60 bg-card p-10 text-center">
        <p className="font-serif text-2xl text-foreground">No reviews yet</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Be the first to share what made your stay memorable.
        </p>
      </div>
    );
  }

  const rounded = Math.round(averageRating ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/70 pb-8">
        <div>
          <p className="eyebrow">Guest reviews</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-5xl font-medium text-foreground">
              {averageRating !== null ? averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''} from verified guests
          </p>
        </div>
        <div className="flex items-center gap-1">{renderStars(rounded, 'md')}</div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {reviews.map((review) => {
          const name = authorName(review);
          const ratingValue = Number(review.rating ?? 0);
          const date = String(review.createdAt ?? '').slice(0, 10);
          return (
            <article key={idOf(review)} className="border-b border-border/60 pb-8 last:border-0 md:border-0 md:pb-0">
              <header className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-serif text-base font-medium text-foreground">
                  {authorInitial(name)}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">Verified guest · {date}</p>
                </div>
              </header>
              <div className="mt-3 flex items-center gap-1">{renderStars(ratingValue)}</div>
              <p className="mt-3 text-[0.95rem] leading-7 text-foreground/85">{review.comment}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}