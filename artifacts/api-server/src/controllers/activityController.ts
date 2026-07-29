import { Request, Response } from "express";
import * as activityService from "../services/activityService";

export async function listActivities(req: Request, res: Response): Promise<void> {
  try {
    const result = await activityService.listActivities(
      req.query as unknown as activityService.ActivityQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list activities." });
  }
}

export async function getActivity(req: Request, res: Response): Promise<void> {
  try {
    const activity = await activityService.getActivityById(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ data: activity });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve activity." });
  }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    const created = await activityService.createActivity(req.body, req.user!.id, req.user!.role);
    res.status(201).json({ message: "Activity created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create activity." });
  }
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  try {
    const updated = await activityService.updateActivity(req.params.id, req.body, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Activity updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update activity." });
  }
}

export async function deleteActivity(req: Request, res: Response): Promise<void> {
  try {
    await activityService.deleteActivity(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Activity deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete activity." });
  }
}
