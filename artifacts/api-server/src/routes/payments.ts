import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as paymentController from "../controllers/paymentController";

const router = Router();

const refundSchema = z.object({
  amount: z.coerce.number().min(0.01, "Refund amount must be greater than 0"),
  reason: z.string().trim().min(5, "Refund reason must be at least 5 characters"),
  refundedAt: z.preprocess((value) => new Date(value as string), z.date()).optional(),
  transactionId: z.string().trim().optional(),
});

const createPaymentSchema = z.object({
  reservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID"),
  customer: z.string().regex(/^[a-f\d]{24}$/i, "Invalid customer ID").optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().trim().length(3).optional(),
  status: z.enum(["pending", "completed", "failed", "refunded", "partial_refund"]).optional(),
  method: z.enum(["credit_card", "debit_card", "paypal", "bank_transfer", "other"]),
  transactionId: z.string().trim().optional(),
  gatewayResponse: z.record(z.unknown()).optional(),
  refunds: z.array(refundSchema).optional(),
  notes: z.string().trim().max(500).optional(),
  paidAt: z.preprocess((value) => new Date(value as string), z.date()).optional(),
  failedAt: z.preprocess((value) => new Date(value as string), z.date()).optional(),
  failureReason: z.string().trim().optional(),
});

const updatePaymentSchema = createPaymentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const paymentListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  reservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID").optional(),
  customer: z.string().regex(/^[a-f\d]{24}$/i, "Invalid customer ID").optional(),
  status: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value;
  }, z.array(z.enum(["pending", "completed", "failed", "refunded", "partial_refund"]))).optional(),
  method: z.enum(["credit_card", "debit_card", "paypal", "bank_transfer", "other"]).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  fromDate: z.preprocess((value) => new Date(value as string), z.date().optional()),
  toDate: z.preprocess((value) => new Date(value as string), z.date().optional()),
  sort: z.enum(["createdAt", "amount", "status", "method"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, authorize("customer", "manager", "admin"), validate(paymentListSchema, "query"), paymentController.listPayments);
router.get("/:id", authenticate, authorize("customer", "manager", "admin"), validate(mongoIdSchema, "params"), paymentController.getPayment);

router.post(
  "/",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(createPaymentSchema),
  paymentController.createPayment,
);

router.patch(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updatePaymentSchema),
  paymentController.updatePayment,
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  paymentController.deletePayment,
);

export default router;
