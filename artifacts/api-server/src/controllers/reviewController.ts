import { Request, Response } from "express";
import * as reviewService from "../services/reviewService";
import { UserRole } from "../models/User";

export async function listReviews(req: Request, res: Response): Promise<void> {
  try {
    const result = await reviewService.listReviews(
      req.query as unknown as reviewService.ReviewQueryOptions,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ data: result.data, meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }});
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reviews." });
  }
}

export async function getReview(req: Request, res: Response): Promise<void> {
  try {
    const review = await reviewService.getReviewById(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ data: review });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve review." });
  }
}

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const created = await reviewService.createReview(req.body, req.user!.id, req.user!.role as UserRole);
    res.status(201).json({ message: "Review created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create review." });
  }
}

export async function updateReview(req: Request, res: Response): Promise<void> {
  try {
    const updated = await reviewService.updateReview(String(req.params.id), req.body, req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Review updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update review." });
  }
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    await reviewService.deleteReview(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Review deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete review." });
  }
}
