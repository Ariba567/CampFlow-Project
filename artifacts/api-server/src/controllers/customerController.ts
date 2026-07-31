import { Request, Response } from "express";
import * as customerService from "../services/customerService";
import { UserRole } from "../models/User";

export async function listCustomers(req: Request, res: Response): Promise<void> {
  try {
    const result = await customerService.listCustomers(
      req.query as unknown as customerService.CustomerQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list customers." });
  }
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(
      String(req.params.id),
      req.user!.id,
      req.user!.role as UserRole,
    );

    res.status(200).json({ data: customer });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve customer." });
  }
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const created = await customerService.createCustomer(req.body, req.user!.role as UserRole);
    res.status(201).json({ message: "Customer created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create customer." });
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  try {
    const updated = await customerService.updateCustomer(
      String(req.params.id),
      req.body,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Customer updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update customer." });
  }
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  try {
    await customerService.deleteCustomer(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete customer." });
  }
}
