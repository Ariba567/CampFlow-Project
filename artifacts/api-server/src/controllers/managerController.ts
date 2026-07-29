import { Request, Response } from "express";
import * as managerService from "../services/managerService";

export async function listManagers(req: Request, res: Response): Promise<void> {
  try {
    const result = await managerService.listManagers(
      req.query as unknown as managerService.ManagerQueryOptions,
      req.user!.id,
      req.user!.role,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list managers." });
  }
}

export async function getManager(req: Request, res: Response): Promise<void> {
  try {
    const manager = await managerService.getManagerById(
      req.params.id,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ data: manager });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve manager." });
  }
}

export async function createManager(req: Request, res: Response): Promise<void> {
  try {
    const created = await managerService.createManager(req.body, req.user!.role);
    res.status(201).json({ message: "Manager created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create manager." });
  }
}

export async function updateManager(req: Request, res: Response): Promise<void> {
  try {
    const updated = await managerService.updateManager(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ message: "Manager updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update manager." });
  }
}

export async function deleteManager(req: Request, res: Response): Promise<void> {
  try {
    await managerService.deleteManager(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Manager deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete manager." });
  }
}
