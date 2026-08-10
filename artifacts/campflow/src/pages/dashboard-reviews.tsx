import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
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

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="size-7 text-primary" /></div>;
  if (error) return <ErrorState title="Reviews unavailable" message={error} />;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Share your stay</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Your reviews</h1>
        <p className="mt-4 text-lg text-muted-foreground">Rate your Green Valley experiences to help fellow campers.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {existingReview ? 'Update your review' : 'Leave a review'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="campground">Campground</Label>
              <Select value={campground} onValueChange={setCampground} required>
                <SelectTrigger id="campground">
                  <SelectValue placeholder="Select a campground" />
                </SelectTrigger>
                <SelectContent>
                  {campgrounds.map((c) => (
                    <SelectItem key={idOf(c)} value={idOf(c)}>{labelOf(c, 'Green Valley')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${star <= rating ? 'fill-current text-accent' : 'text-muted-foreground/30'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Your review</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share a few details about your stay..."
                rows={5}
                maxLength={500}
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
            </div>

             {error && <p className="text-sm text-destructive">{error}</p>}

            {(!existingReview && !eligibilityLoading && !eligibilityReservationId) && (
              <p className="text-sm text-muted-foreground">You can only review campgrounds where you have completed a stay.</p>
            )}

            <Button type="submit" disabled={saving || !campground || rating === 0 || comment.trim().length < 10 || (!existingReview && !eligibilityReservationId)}>
              {saving ? 'Saving…' : existingReview ? 'Update review' : 'Post review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <h2 className="font-serif text-3xl">Your reviews</h2>
        {reviews.length ? (
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <Card key={idOf(review)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-accent">
                        {Array.from({ length: Number(review.rating ?? 0) }, (_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="font-semibold">{labelOf(review.campground, 'Green Valley')}</span>
                    </div>
                    <time className="text-sm text-muted-foreground">
                      {String(review.createdAt ?? '').slice(0, 10)}
                    </time>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/campgrounds/${idOf(review.campground)}`}>View campground</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void handleDelete(idOf(review))}>
                        Delete
                      </Button>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No reviews yet — write one above to get started.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
