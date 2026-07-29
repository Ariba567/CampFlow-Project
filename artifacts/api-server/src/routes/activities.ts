import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as activityController from "../controllers/activityController";

const router = Router();

const scheduleItemSchema = z.object({
  day: z.string().trim().min(1, "Day is required"),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Start time must be HH:mm"),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "End time must be HH:mm"),
  maxParticipants: z.coerce.number().int().min(1).optional(),
});

const ageRestrictionSchema = z.object({
  min: z.coerce.number().int().min(0).optional(),
  max: z.coerce.number().int().min(0).optional(),
});

const createActivitySchema = z.object({
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description cannot exceed 2000 characters"),
  type: z.string().trim().min(1, "Type is required"),
  difficulty: z.enum(["easy", "moderate", "hard", "expert"]),
  durationMinutes: z.coerce.number().int().min(15, "Duration must be at least 15 minutes"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  isIncluded: z.boolean(),
  images: z.array(z.string().trim().url("Image URLs must be valid")).optional(),
  schedule: z.array(scheduleItemSchema).optional(),
  minParticipants: z.coerce.number().int().min(1).default(1),
  maxParticipants: z.coerce.number().int().min(1).optional(),
  ageRestriction: ageRestrictionSchema.optional(),
  requirements: z.array(z.string().trim()).optional(),
  equipment: z.array(z.string().trim()).optional(),
  isActive: z.boolean().default(true),
});

const updateActivitySchema = createActivitySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const activityListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID").optional(),
  type: z.string().trim().optional(),
  difficulty: z.enum(["easy", "moderate", "hard", "expert"]).optional(),
  isIncluded: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  isActive: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["name", "price", "duration", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", authenticate, validate(activityListSchema, "query"), activityController.listActivities);
router.get("/:id", authenticate, validate(mongoIdSchema, "params"), activityController.getActivity);

router.post(
  "/",
  authenticate,
  authorize("manager", "admin"),
  validate(createActivitySchema),
  activityController.createActivity,
);

router.patch(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateActivitySchema),
  activityController.updateActivity,
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  activityController.deleteActivity,
);

export default router;
