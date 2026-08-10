import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, paginationSchema } from "../middleware/validate";
import * as reviewController from "../controllers/reviewController";

const router = Router();

// ─── Param schemas ────────────────────────────────────────────────────────────
const campgroundIdSchema = z.object({
  campgroundId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
});

const customerIdSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
});

const reviewIdSchema = z.object({
  reviewId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
});

const eligibilitySchema = z.object({
  campgroundId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId"),
});

// ─── Body schemas ─────────────────────────────────────────────────────────────
const createReviewSchema = z.object({
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  reservationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters").max(500, "Comment cannot exceed 500 characters"),
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5").optional(),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters").max(500, "Comment cannot exceed 500 characters").optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

// ─── Routes (static paths before parametric) ───────────────────────────────────
router.get(
  "/campground/:campgroundId",
  validate(campgroundIdSchema, "params"),
  reviewController.listReviewsByCampground,
);

router.get(
  "/customer/:customerId",
  authenticate,
  authorize("customer"),
  validate(customerIdSchema, "params"),
  reviewController.listReviewsByCustomer,
);

router.get(
  "/eligibility/:campgroundId",
  authenticate,
  authorize("customer"),
  validate(eligibilitySchema, "params"),
  reviewController.checkEligibility,
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  validate(createReviewSchema),
  reviewController.createReview,
);

router.put(
  "/:reviewId",
  authenticate,
  authorize("customer"),
  validate(reviewIdSchema, "params"),
  validate(updateReviewSchema),
  reviewController.updateReview,
);

router.delete(
  "/:reviewId",
  authenticate,
  authorize("customer"),
  validate(reviewIdSchema, "params"),
  reviewController.deleteReview,
);

export default router;
