import { Request, Response } from "express";
import * as reservationService from "../services/reservationService";
import { UserRole } from "../models/User";

export async function listReservations(req: Request, res: Response): Promise<void> {
  try {
    const result = await reservationService.listReservations(
      req.query as unknown as reservationService.ReservationQueryOptions,
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
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to list reservations." });
  }
}

export async function checkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const result = await reservationService.checkReservationAvailability({
      campsite: String(req.query.campsite ?? req.body.campsite ?? ""),
      campground: String(req.query.campground ?? req.body.campground ?? ""),
      checkIn: new Date(String(req.query.checkIn ?? req.body.checkIn ?? "")),
      checkOut: new Date(String(req.query.checkOut ?? req.body.checkOut ?? "")),
    });
    res.status(200).json({ data: result });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to check campsite availability." });
  }
}

export async function quoteReservation(req: Request, res: Response): Promise<void> {
  try {
    const quote = await reservationService.quoteReservation({
      campsite: String(req.query.campsite ?? req.body.campsite ?? ""),
      campground: String(req.query.campground ?? req.body.campground ?? ""),
      checkIn: new Date(String(req.query.checkIn ?? req.body.checkIn ?? "")),
      checkOut: new Date(String(req.query.checkOut ?? req.body.checkOut ?? "")),
    });
    res.status(200).json({ data: quote });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve reservation quote." });
  }
}

export async function getReservation(req: Request, res: Response): Promise<void> {
  try {
    const reservation = await reservationService.getReservationById(
      String(req.params.id),
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ data: reservation });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to retrieve reservation." });
  }
}

export async function createReservation(req: Request, res: Response): Promise<void> {
  try {
    const created = await reservationService.createReservation(req.body, req.user!.id, req.user!.role);
    res.status(201).json({ message: "Reservation created successfully.", data: created });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to create reservation." });
  }
}

export async function updateReservation(req: Request, res: Response): Promise<void> {
  try {
    const updated = await reservationService.updateReservation(
      String(req.params.id),
      req.body,
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Reservation updated successfully.", data: updated });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to update reservation." });
  }
}

export async function cancelReservation(req: Request, res: Response): Promise<void> {
  try {
    const cancelled = await reservationService.cancelReservation(
      String(req.params.id),
      req.user!.id,
      req.user!.role as UserRole,
    );
    res.status(200).json({ message: "Reservation cancelled successfully.", data: cancelled });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to cancel reservation." });
  }
}

export async function deleteReservation(req: Request, res: Response): Promise<void> {
  try {
    await reservationService.deleteReservation(String(req.params.id), req.user!.id, req.user!.role as UserRole);
    res.status(200).json({ message: "Reservation deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to delete reservation." });
  }
}
