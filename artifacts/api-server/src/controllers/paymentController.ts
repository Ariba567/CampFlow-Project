import { Request, Response } from "express";
import * as paymentService from "../services/paymentService";
import { UserRole } from "../models/User";

export async function listPayments(req: Request, res: Response): Promise<void> {
  try {
    const result = await paymentService.listPayments(
      req.query as unknown as paymentService.PaymentQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list payments." });
  }
}

export async function getPayment(req: Request, res: Response): Promise<void> {
  try {
    const payment = await paymentService.getPaymentById(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ data: payment });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve payment." });
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const created = await paymentService.createPayment(req.body, req.user!.id, req.user!.role as UserRole);
    res.status(201).json({ message: "Payment created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create payment." });
  }
}

export async function updatePayment(req: Request, res: Response): Promise<void> {
  try {
    const updated = await paymentService.updatePayment(String(req.params.id), req.body, req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Payment updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update payment." });
  }
}

export async function deletePayment(req: Request, res: Response): Promise<void> {
  try {
    await paymentService.deletePayment(String(req.params.id));
    res.status(200).json({ message: "Payment deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete payment." });
  }
}
