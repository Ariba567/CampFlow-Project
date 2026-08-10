import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiError, createReview, type ApiItem } from '@/services/customerDashboardService';

interface ReviewFormProps {
  campgroundId: string;
  reservationId: string;
  existingReview?: ApiItem;
  onSubmitted: () => void;
}

export default function ReviewForm({ campgroundId, reservationId, existingReview, onSubmitted }: ReviewFormProps) {
  const isEdit = !!existingReview;
  const [rating, setRating] = useState(isEdit ? Number(existingReview.rating) : 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(isEdit ? String(existingReview.comment ?? '') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Your review must be at least 10 characters.');
      return;
    }
    if (comment.trim().length > 500) {
      setError('Your review cannot exceed 500 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createReview({ campground: campgroundId, reservationId, rating, comment: comment.trim() });
      toast.success(isEdit ? 'Your review was updated.' : 'Thank you for your review!');
      onSubmitted();
    } catch (caught) {
      setError(apiError(caught, 'We could not save your review.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Your rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
              aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-current text-accent'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-xs text-muted-foreground">{rating} star{rating !== 1 ? 's' : ''}</p>}
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
        />
        <div className="flex justify-between">
          {comment.length < 10 && (
            <p className="text-xs text-muted-foreground">{10 - comment.length} more characters needed</p>
          )}
          <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving || rating === 0 || comment.trim().length < 10}>
        {saving ? 'Saving...' : isEdit ? 'Update review' : 'Post review'}
      </Button>
    </form>
  );
}
