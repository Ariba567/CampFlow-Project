import { Request, Response } from "express";
import * as dashboardService from "../services/dashboardService";

// Customer endpoints
export async function customerSummary(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getCustomerSummary(req.user!.id);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load customer summary." });
  }
}

export async function customerProfile(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getCustomerProfile(req.user!.id);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load profile." });
  }
}

export async function customerReservations(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const sort = q.sort ?? "createdAt";
    const order = q.order ?? "desc";
    const status = q.status;
    const upcoming = q.upcoming === "true" || q.upcoming === true;
    const result = await dashboardService.listCustomerReservations(req.user!.id, { page: Number(page), limit: Number(limit), sort, order, status, upcoming });
    res.status(200).json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reservations." });
  }
}

export async function customerFavorites(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const result = await dashboardService.listCustomerFavorites(req.user!.id, { page, limit });
    res.status(200).json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list favorites." });
  }
}

export async function addCustomerFavorite(req: Request, res: Response): Promise<void> {
  try {
    await dashboardService.addCustomerFavorite(req.user!.id, String(req.params.id));
    res.status(200).json({ message: "Campsite added to favorites." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to add favorite." });
  }
}

export async function removeCustomerFavorite(req: Request, res: Response): Promise<void> {
  try {
    await dashboardService.removeCustomerFavorite(req.user!.id, String(req.params.id));
    res.status(200).json({ message: "Campsite removed from favorites." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to remove favorite." });
  }
}

export async function customerActivities(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const result = await dashboardService.listCustomerActivities(req.user!.id, { page, limit });
    res.status(200).json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list activities." });
  }
}

export async function customerNotifications(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const result = await dashboardService.listCustomerNotifications(req.user!.id, { page, limit });
    res.status(200).json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list notifications." });
  }
}

export async function customerPayments(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const result = await dashboardService.listCustomerPayments(req.user!.id, { page, limit });
    res.status(200).json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list payments." });
  }
}

export async function customerStats(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getCustomerDashboardStats(req.user!.id);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load stats." });
  }
}

// Manager endpoints
export async function managerSummary(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getManagerSummary(req.user!.id);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load manager summary." });
  }
}

export async function managerCampgroundStats(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getManagerCampgroundStats(req.user!.id);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load campground stats." });
  }
}

export async function managerCampsiteOccupancy(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const data = await dashboardService.listManagerCampsiteOccupancy(req.user!.id, { page, limit, sort: q.sort, order: q.order });
    res.status(200).json({ data: data.data, meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list campsite occupancy." });
  }
}

export async function managerReservations(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const status = q.status ? (Array.isArray(q.status) ? q.status : q.status.split(",")) : undefined;
    const data = await dashboardService.listManagerReservations(req.user!.id, { page, limit, status, campground: q.campground, sort: q.sort, order: q.order });
    res.status(200).json({ data: data.data, meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reservations." });
  }
}

export async function managerRevenue(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    const data = await dashboardService.getManagerRevenueSummary(req.user!.id, from, to);
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load revenue." });
  }
}

export async function managerReviews(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const data = await dashboardService.listManagerReviews(req.user!.id, { page, limit });
    res.status(200).json({ data: data.data, meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reviews." });
  }
}

// Admin endpoints
export async function adminSummary(req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getAdminSummary();
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to load admin summary." });
  }
}

export async function adminRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const data = await dashboardService.listRecentSystemActivity({ page, limit });
    res.status(200).json({ data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list recent activity." });
  }
}

export async function adminUsers(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as unknown as any;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const data = await dashboardService.listAdminUsers({ page, limit, search: q.search, role: q.role });
    res.status(200).json({ data: data.data, meta: { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list users." });
  }
}
