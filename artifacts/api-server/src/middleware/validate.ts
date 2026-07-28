import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

type RequestPart = "body" | "params" | "query";

/**
 * validate(schema, part?)
 * Validates the specified part of the request against a Zod schema.
 * Responds with 400 and structured errors on failure.
 * Replaces the request part with the parsed (coerced/stripped) value on success.
 *
 * Usage:
 *   router.post("/auth/register", validate(registerSchema), registerHandler);
 *   router.get("/campgrounds/:id", validate(idParamSchema, "params"), getCampground);
 */
export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    // Replace with parsed output (handles defaults, coercion, strip unknown)
    (req as Request & Record<string, unknown>)[part] = result.data;
    next();
  };
}

// ─── Common reusable schemas ──────────────────────────────────────────────────

export const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
