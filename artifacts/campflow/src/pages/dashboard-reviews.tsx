import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { toast } from 'sonner';
import { apiError, checkReviewEligibility, createReview, deleteReview, idOf, labelOf, listCampgrounds, listCustomerReviews, type ApiItem } from '@/services/customerDashboardService';

export default function DashboardReviews() {
  const [reviews, setReviews] = useState<ApiItem[]>([]);
  const [campgrounds, setCampgrounds] = useState<ApiItem[]>([]);
  const [campground, setCampground] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityReservationId, setEligibilityReservationId] = useState<string | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listCustomerReviews(), listCampgrounds()])
      .then(([reviewResult, campgroundResult]) => {
        setReviews(reviewResult.data);
        setCampgrounds(campgroundResult);
      })
      .catch((caught) => setError(apiError(caught, 'We could not load your reviews.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const existingReview = campground ? reviews.find((r) => idOf(r.campground) === campground) : undefined;

  useEffect(() => {
    if (existingReview) {
      setRating(Number(existingReview.rating));
      setComment(String(existingReview.comment ?? ''));
    } else if (campground) {
      setRating(0);
      setComment('');
    }
  }, [existingReview, campground]);

  useEffect(() => {
    if (!campground || existingReview) {
      setEligibilityReservationId(null);
      return;
    }
    setEligibilityLoading(true);
    checkReviewEligibility(campground)
      .then((result) => {
        setEligibilityReservationId(result.eligible ? result.reservationId : null);
      })
      .catch(() => setEligibilityReservationId(null))
      .finally(() => setEligibilityLoading(false));
  }, [campground, existingReview]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1) {
      setError('Select a star rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const reservationId = existingReview ? idOf(existingReview.reservationId) : eligibilityReservationId;
      if (!reservationId) {
        setError('You can only review campgrounds where you have completed a stay.');
        setSaving(false);
        return;
      }
      await createReview({ campground, reservationId, rating, comment: comment.trim() });
      toast.success(existingReview ? 'Review updated.' : 'Thank you for your review!');
      setCampground('');
      setRating(0);
      setComment('');
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not submit your review.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted.');
      load();
    } catch (caught) {
      toast.error(apiError(caught, 'Could not delete review.'));
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }
  if (error && !reviews.length) return <ErrorState title="Reviews unavailable" message={error} />;

  return (
    <div className="container-page mx-auto max-w-4xl space-y-16 pb-16">
      <section className="border-b border-border/60 pb-12">
        <p className="eyebrow">Share your stay</p>
        <h1 className="display-1 mt-5">Your reviews</h1>
        <p className="lede mt-5 max-w-2xl">
          Rate your Green Valley experiences to help fellow campers find their next
          favorite spot. Honest, specific, in your own words.
        </p>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Write</p>
            <h2 className="display-3 mt-3">
              {existingReview ? 'Update your review' : 'Leave a review'}
            </h2>
          </div>
          <span className="hidden font-serif text-sm italic text-muted-foreground sm:inline">01</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              {existingReview ? labelOf(existingReview.campground, 'Green Valley') : 'A new note from the field'}
            </CardTitle>
            <p className="lede mt-1 text-sm">Stars and a few honest sentences are enough.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-2">
                <Label htmlFor="campground">Campground</Label>
                <Select value={campground} onValueChange={setCampground} required>
                  <SelectTrigger id="campground" className="h-12">
                    <SelectValue placeholder="Select a campground" />
                  </SelectTrigger>
                  <SelectContent>
                    {campgrounds.map((c) => (
                      <SelectItem key={idOf(c)} value={idOf(c)}>
                        {labelOf(c, 'Green Valley')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Your rating</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="rounded-sm p-1 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= rating
                            ? 'fill-current text-accent'
                            : 'text-muted-foreground/30 hover:text-accent/60'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="font-serif text-sm italic text-muted-foreground">
                      {rating} of 5
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your review</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share a few details about your stay..."
                  rows={6}
                  maxLength={500}
                  required
                  minLength={10}
                  className="resize-none"
                />
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <span>Be specific, be kind.</span>
                  <span>{comment.length}/500 characters</span>
                </div>
              </div>

              {error && (
                <p className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              {!existingReview && !eligibilityLoading && !eligibilityReservationId && campground && (
                <p className="border-l-2 border-accent bg-secondary/40 px-4 py-3 text-sm">
                  You can only review campgrounds where you have completed a stay.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !campground ||
                    rating === 0 ||
                    comment.trim().length < 10 ||
                    (!existingReview && !eligibilityReservationId)
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? 'Saving…' : existingReview ? 'Update review' : 'Post review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="border-t border-border/60 pt-16">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">What you&rsquo;ve written</p>
            <h2 className="display-3 mt-3">Your reviews</h2>
          </div>
          <span className="font-serif text-sm italic text-muted-foreground">
            {String(reviews.length).padStart(2, '0')} published
          </span>
        </div>
        {reviews.length ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={idOf(review)}>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-accent">
                        {Array.from({ length: Number(review.rating ?? 0) }, (_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="font-serif text-xl">{labelOf(review.campground, 'Green Valley')}</p>
                    </div>
                    <time className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {String(review.createdAt ?? '').slice(0, 10)}
                    </time>
                  </div>
                  <p className="lede mt-5 text-base">{review.comment}</p>
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-5">
                    <Button asChild variant="outline" size="sm" className="border-primary/30">
                      <Link to={`/campgrounds/${idOf(review.campground)}`}>
                        View campground <ArrowUpRight />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => void handleDelete(idOf(review))}
                    >
                      <Trash2 />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="font-serif text-xl">No reviews yet</p>
              <p className="lede mt-2">Write one above to get started.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}