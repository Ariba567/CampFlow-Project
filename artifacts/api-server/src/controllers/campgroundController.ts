import { Request, Response } from "express";
import * as campgroundService from "../services/campgroundService";

export async function listCampgrounds(req: Request, res: Response): Promise<void> {
  try {
    const result = await campgroundService.listCampgrounds(req.query as unknown as campgroundService.CampgroundQueryOptions);
    res.status(200).json({ data: result.data, meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }});
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list campgrounds." });
  }
}

export async function getCampground(req: Request, res: Response): Promise<void> {
  try {
    const campground = await campgroundService.getCampgroundById(req.params.id);
    res.status(200).json({ data: campground });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve campground." });
  }
}

export async function createCampground(req: Request, res: Response): Promise<void> {
  try {
    const created = await campgroundService.createCampground(req.body, req.user!.id);
    res.status(201).json({ message: "Campground created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create campground." });
  }
}

export async function updateCampground(req: Request, res: Response): Promise<void> {
  try {
    const updated = await campgroundService.updateCampground(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ message: "Campground updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update campground." });
  }
}

export async function deleteCampground(req: Request, res: Response): Promise<void> {
  try {
    await campgroundService.deleteCampground(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Campground deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete campground." });
  }
}
