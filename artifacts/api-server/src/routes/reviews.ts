import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as reviewController from "../controllers/reviewController";

const router = Router();

const ratingBreakdownSchema = z.object({
  cleanliness: z.coerce.number().int().min(1).max(5),
  facilities: z.coerce.number().int().min(1).max(5),
  location: z.coerce.number().int().min(1).max(5),
  value: z.coerce.number().int().min(1).max(5),
  staff: z.coerce.number().int().min(1).max(5),
});

const createReviewSchema = z.object({
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID").optional(),
  reservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID"),
  overallRating: z.coerce.number().int().min(1).max(5),
  ratingBreakdown: ratingBreakdownSchema,
  title: z.string().trim().min(5).max(150),
  body: z.string().trim().min(20).max(3000),
  images: z.array(z.string().trim().url("Image URLs must be valid")).optional(),
  ownerResponse: z.string().trim().max(1000).optional(),
  isApproved: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

const updateReviewSchema = createReviewSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const reviewListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID").optional(),
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID").optional(),
  reservation: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reservation ID").optional(),
  customer: z.string().regex(/^[a-f\d]{24}$/i, "Invalid customer ID").optional(),
  isApproved: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  isHidden: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(["createdAt", "overallRating", "helpfulVotes"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, authorize("customer", "manager", "admin"), validate(reviewListSchema, "query"), reviewController.listReviews);
router.get("/:id", authenticate, authorize("customer", "manager", "admin"), validate(mongoIdSchema, "params"), reviewController.getReview);

router.post("/", authenticate, authorize("customer", "manager", "admin"), validate(createReviewSchema), reviewController.createReview);
router.patch(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateReviewSchema),
  reviewController.updateReview,
);
router.delete(
  "/:id",
  authenticate,
  authorize("customer", "manager", "admin"),
  validate(mongoIdSchema, "params"),
  reviewController.deleteReview,
);

export default router;
