import { Request, Response } from "express";
import * as notificationService from "../services/notificationService";
import { UserRole } from "../models/User";

export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const result = await notificationService.listNotifications(
      req.query as unknown as notificationService.NotificationQueryOptions,
      req.user!.id,
      req.user!.role as UserRole,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list notifications." });
  }
}

export async function getNotification(req: Request, res: Response): Promise<void> {
  try {
    const notification = await notificationService.getNotificationById(
      String(req.params.id),
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ data: notification });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve notification." });
  }
}

export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const created = await notificationService.createNotification(req.body, req.user!.role as UserRole);
    res.status(201).json({ message: "Notification created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create notification." });
  }
}

export async function updateNotification(req: Request, res: Response): Promise<void> {
  try {
    const updated = await notificationService.updateNotification(
      String(req.params.id),
      req.body,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Notification updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update notification." });
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    await notificationService.deleteNotification(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete notification." });
  }
}
