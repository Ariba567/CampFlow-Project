import { Request, Response } from "express";
import * as administratorService from "../services/administratorService";

export async function listAdministrators(req: Request, res: Response): Promise<void> {
  try {
    const result = await administratorService.listAdministrators(
      req.query as unknown as administratorService.AdministratorQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list administrators." });
  }
}

export async function getAdministrator(req: Request, res: Response): Promise<void> {
  try {
    const administrator = await administratorService.getAdministratorById(
      req.params.id,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ data: administrator });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve administrator." });
  }
}

export async function createAdministrator(req: Request, res: Response): Promise<void> {
  try {
    const created = await administratorService.createAdministrator(req.body, req.user!.role);
    res.status(201).json({ message: "Administrator created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create administrator." });
  }
}

export async function updateAdministrator(req: Request, res: Response): Promise<void> {
  try {
    const updated = await administratorService.updateAdministrator(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role,
    );
    res.status(200).json({ message: "Administrator updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update administrator." });
  }
}

export async function deleteAdministrator(req: Request, res: Response): Promise<void> {
  try {
    await administratorService.deleteAdministrator(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Administrator deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete administrator." });
  }
}
