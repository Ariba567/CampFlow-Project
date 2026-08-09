import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as reservationController from "../controllers/reservationController";

const router = Router();

const guestsSchema = z.object({
  adults: z.coerce.number().int().min(1, "At least 1 adult is required"),
  children: z.coerce.number().int().min(0).default(0),
  vehicles: z.coerce.number().int().min(0).default(0),
});

const pricingSchema = z.object({
  baseRate: z.coerce.number().min(0, "Base rate cannot be negative"),
  nights: z.coerce.number().int().min(1, "Nights must be at least 1"),
  subtotal: z.coerce.number().min(0, "Subtotal cannot be negative"),
  taxes: z.coerce.number().min(0).default(0),
  fees: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0, "Total cannot be negative"),
});

const dateStringToDate = (value: unknown) => {
  if (typeof value !== "string") return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
};

const createReservationSchema = z.object({
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID"),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  checkIn: z.preprocess(dateStringToDate, z.date()),
  checkOut: z.preprocess(dateStringToDate, z.date()),
  guests: guestsSchema,
  pricing: pricingSchema,
  specialRequests: z.string().trim().max(1000).optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
});

const updateReservationSchema = createReservationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const reservationListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  reservationNumber: z.string().trim().optional(),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID").optional(),
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID").optional(),
  customer: z.string().regex(/^[a-f\d]{24}$/i, "Invalid customer ID").optional(),
  status: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value;
  }, z.array(z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]))).optional(),
  checkInFrom: z.preprocess(dateStringToDate, z.date().optional()),
  checkInTo: z.preprocess(dateStringToDate, z.date().optional()),
  checkOutFrom: z.preprocess(dateStringToDate, z.date().optional()),
  checkOutTo: z.preprocess(dateStringToDate, z.date().optional()),
  minTotal: z.coerce.number().min(0).optional(),
  maxTotal: z.coerce.number().min(0).optional(),
  sort: z.enum(["createdAt", "checkIn", "checkOut", "status", "total"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, authorize("customer", "manager", "admin"), validate(reservationListSchema, "query"), reservationController.listReservations);

const quoteSchema = z.object({
  campground: z.string().min(1, "Campground is required"),
  campsite: z.string().min(1, "Campsite is required"),
  checkIn: z.preprocess(dateStringToDate, z.date()),
  checkOut: z.preprocess(dateStringToDate, z.date()),
});
router.get("/quote", authenticate, authorize("customer", "manager", "admin"), validate(quoteSchema, "query"), reservationController.quoteReservation);

const availabilitySchema = z.object({
  campground: z.string().min(1, "Campground is required"),
  campsite: z.string().min(1, "Campsite is required"),
  checkIn: z.preprocess(dateStringToDate, z.date()),
  checkOut: z.preprocess(dateStringToDate, z.date()),
});
router.get("/availability", authenticate, authorize("customer", "manager", "admin"), validate(availabilitySchema, "query"), reservationController.checkAvailability);

router.get("/:id", authenticate, authorize("customer", "manager", "admin"), validate(mongoIdSchema, "params"), reservationController.getReservation);

router.post("/", authenticate, authorize("customer", "manager", "admin"), validate(createReservationSchema), reservationController.createReservation);
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  reservationController.cancelReservation,
);
router.patch(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateReservationSchema),
  reservationController.updateReservation,
);
router.delete(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  reservationController.deleteReservation,
);

export default router;
