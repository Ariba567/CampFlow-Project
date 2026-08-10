import { Request, Response } from "express";
import * as reviewService from "../services/reviewService";
import { UserRole } from "../models/User";

// GET /api/reviews/eligibility/:campgroundId — customer: check if they can review
export async function checkEligibility(req: Request, res: Response): Promise<void> {
  try {
    const result = await reviewService.checkReviewEligibility(
      String(req.params.campgroundId),
      req.user!.id,
    );
    res.status(200).json({ data: result });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to check eligibility." });
  }
}

// GET /api/reviews/campground/:campgroundId — public
export async function listReviewsByCampground(req: Request, res: Response): Promise<void> {
  try {
    const result = await reviewService.listReviewsByCampground(String(req.params.campgroundId));
    res.status(200).json({
      data: result.data,
      averageRating: result.averageRating,
      totalReviews: result.totalReviews,
    });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reviews." });
  }
}

// GET /api/reviews/customer/:customerId — customer only (own reviews)
export async function listReviewsByCustomer(req: Request, res: Response): Promise<void> {
  try {
    const customerId = String(req.params.customerId);
    const result = await reviewService.listReviewsByCustomer(
      customerId,
      req.user!.id,
      req.user!.role as UserRole,
      { page: 1, limit: 100 },
    );
    res.status(200).json({
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reviews." });
  }
}

// POST /api/reviews — create (upsert) review, customer only
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const created = await reviewService.createReview(
      req.body as reviewService.ReviewCreateInput,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(201).json({ message: "Review created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create review." });
  }
}

// PUT /api/reviews/:reviewId — update review, only author
export async function updateReview(req: Request, res: Response): Promise<void> {
  try {
    const updated = await reviewService.updateReview(
      String(req.params.reviewId),
      req.body as reviewService.ReviewUpdateInput,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Review updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update review." });
  }
}

// DELETE /api/reviews/:reviewId — delete review, only author
export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    await reviewService.deleteReview(
      String(req.params.reviewId),
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Review deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete review." });
  }
}
