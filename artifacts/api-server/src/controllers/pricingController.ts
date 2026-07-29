import { Request, Response } from "express";
import * as pricingService from "../services/pricingService";

export async function listPricing(req: Request, res: Response): Promise<void> {
  try {
    const result = await pricingService.listPricing(
      req.query as unknown as pricingService.PricingQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list pricing rules." });
  }
}

export async function getPricing(req: Request, res: Response): Promise<void> {
  try {
    const pricing = await pricingService.getPricingById(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ data: pricing });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve pricing rule." });
  }
}

export async function createPricing(req: Request, res: Response): Promise<void> {
  try {
    const created = await pricingService.createPricing(req.body, req.user!.id, req.user!.role);
    res.status(201).json({ message: "Pricing rule created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create pricing rule." });
  }
}

export async function updatePricing(req: Request, res: Response): Promise<void> {
  try {
    const updated = await pricingService.updatePricing(req.params.id, req.body, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Pricing rule updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update pricing rule." });
  }
}

export async function deletePricing(req: Request, res: Response): Promise<void> {
  try {
    await pricingService.deletePricing(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ message: "Pricing rule deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete pricing rule." });
  }
}
