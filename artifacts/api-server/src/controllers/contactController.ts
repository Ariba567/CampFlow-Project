import { Request, Response } from "express";
import * as contactService from "../services/contactService";

export async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const contact = await contactService.createContact(req.body);
    res.status(201).json({ message: "Contact inquiry submitted successfully.", data: contact });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    res.status(error.status ?? 500).json({ error: error.message ?? "Failed to submit your message." });
  }
}
