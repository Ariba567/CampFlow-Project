import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as pricingController from "../controllers/pricingController";

const router = Router();

const createPricingSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID").optional(),
  type: z.enum(["seasonal", "weekend", "holiday", "promotional"]),
  applyMode: z.enum(["multiplier", "flat_rate", "override"]),
  multiplier: z.coerce.number().positive().optional(),
  flatRate: z.coerce.number().min(0).optional(),
  startDate: z.preprocess((value) => new Date(value as string), z.date()),
  endDate: z.preprocess((value) => new Date(value as string), z.date()),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  couponCode: z.string().trim().optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  description: z.string().trim().max(500).optional(),
});

const updatePricingSchema = createPricingSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const pricingListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID").optional(),
  campsite: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campsite ID").optional(),
  type: z.enum(["seasonal", "weekend", "holiday", "promotional"]).optional(),
  applyMode: z.enum(["multiplier", "flat_rate", "override"]).optional(),
  isActive: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  couponCode: z.string().trim().optional(),
  minPriority: z.coerce.number().int().min(0).optional(),
  maxPriority: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["priority", "startDate", "endDate", "name"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, validate(pricingListSchema, "query"), pricingController.listPricing);
router.get("/:id", authenticate, validate(mongoIdSchema, "params"), pricingController.getPricing);

router.post(
  "/",
  authenticate,
  authorize("manager", "admin"),
  validate(createPricingSchema),
  pricingController.createPricing,
);

router.patch(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updatePricingSchema),
  pricingController.updatePricing,
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  pricingController.deletePricing,
);

export default router;
