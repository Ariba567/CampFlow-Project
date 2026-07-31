import { Request, Response } from "express";
import * as campsiteService from "../services/campsiteService";
import { UserRole } from "../models/User";

export async function listCampsites(req: Request, res: Response): Promise<void> {
  try {
    const result = await campsiteService.listCampsites(req.query as unknown as campsiteService.CampsiteQueryOptions);
    res.status(200).json({ data: result.data, meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }});
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list campsites." });
  }
}

export async function getCampsite(req: Request, res: Response): Promise<void> {
  try {
    const campsite = await campsiteService.getCampsiteById(String(req.params.id));
    res.status(200).json({ data: campsite });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve campsite." });
  }
}

export async function createCampsite(req: Request, res: Response): Promise<void> {
  try {
    const created = await campsiteService.createCampsite(req.body, req.user!.id, req.user!.role as UserRole);
    res.status(201).json({ message: "Campsite created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create campsite." });
  }
}

export async function updateCampsite(req: Request, res: Response): Promise<void> {
  try {
    const updated = await campsiteService.updateCampsite(
      String(req.params.id),
      req.body,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Campsite updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update campsite." });
  }
}

export async function deleteCampsite(req: Request, res: Response): Promise<void> {
  try {
    await campsiteService.deleteCampsite(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Campsite deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete campsite." });
  }
}
