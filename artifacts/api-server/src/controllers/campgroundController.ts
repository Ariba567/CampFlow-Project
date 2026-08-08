import { Request, Response } from "express";
import * as campgroundService from "../services/campgroundService";
import { UserRole } from "../models/User";

function coerceIsActive(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function listCampgrounds(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as Record<string, unknown>;
    const options: campgroundService.CampgroundQueryOptions = {
      ...query,
      isActive: coerceIsActive(query.isActive),
    } as unknown as campgroundService.CampgroundQueryOptions;
    const result = await campgroundService.listCampgrounds(options);
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
    const campground = await campgroundService.getCampgroundById(String(req.params.id));
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
      String(req.params.id),
      req.body,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Campground updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update campground." });
  }
}

export async function deleteCampground(req: Request, res: Response): Promise<void> {
  try {
    await campgroundService.deleteCampground(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Campground deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete campground." });
  }
}
