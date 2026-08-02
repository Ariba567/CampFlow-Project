import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as notificationController from "../controllers/notificationController";

const router = Router();

const createNotificationSchema = z.object({
  recipient: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipient ID"),
  type: z.enum([
    "booking_confirmation",
    "booking_cancellation",
    "booking_reminder",
    "payment_confirmation",
    "payment_failed",
    "review_request",
    "system_message",
    "promotion",
  ]),
  title: z.string().trim().min(3).max(200),
  message: z.string().trim().min(5).max(2000),
  isRead: z.boolean().optional(),
  readAt: z.preprocess((value) => new Date(value as string), z.date().optional()),
  sentAt: z.preprocess((value) => new Date(value as string), z.date().optional()),
  channels: z.array(z.enum(["in_app", "email", "sms"]))
    .optional()
    .default(["in_app"]),
  emailSent: z.boolean().optional(),
  smsSent: z.boolean().optional(),
  relatedReservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID").optional(),
  relatedPayment: z.string().regex(/^[a-f\d]{24}$/i, "Invalid payment ID").optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.preprocess((value) => new Date(value as string), z.date().optional()),
});

const updateNotificationSchema = createNotificationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const notificationListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  recipient: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipient ID").optional(),
  type: z.enum([
    "booking_confirmation",
    "booking_cancellation",
    "booking_reminder",
    "payment_confirmation",
    "payment_failed",
    "review_request",
    "system_message",
    "promotion",
  ]).optional(),
  isRead: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  emailSent: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  smsSent: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  relatedReservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID").optional(),
  relatedPayment: z.string().regex(/^[a-f\d]{24}$/i, "Invalid payment ID").optional(),
  sentFrom: z.preprocess((value) => new Date(value as string), z.date().optional()),
  sentTo: z.preprocess((value) => new Date(value as string), z.date().optional()),
  createdFrom: z.preprocess((value) => new Date(value as string), z.date().optional()),
  createdTo: z.preprocess((value) => new Date(value as string), z.date().optional()),
  sort: z.enum(["createdAt", "sentAt", "type", "isRead"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, authorize("customer", "manager", "admin"), validate(notificationListSchema, "query"), notificationController.listNotifications);
router.get("/:id", authenticate, authorize("customer", "manager", "admin"), validate(mongoIdSchema, "params"), notificationController.getNotification);

router.post(
  "/",
  authenticate,
  authorize("manager", "admin"),
  validate(createNotificationSchema),
  notificationController.createNotification,
);

router.patch(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateNotificationSchema),
  notificationController.updateNotification,
);

router.delete(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  notificationController.deleteNotification,
);

export default router;
