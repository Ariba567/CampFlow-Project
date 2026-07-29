import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as campsiteController from "../controllers/campsiteController";

const router = Router();

const capacitySchema = z.object({
  maxGuests: z.coerce.number().int().min(1, "Max guests must be at least 1"),
  maxTents: z.coerce.number().int().min(0).optional(),
  maxRvLength: z.coerce.number().int().min(0).optional(),
});

const mapCoordinatesSchema = z.object({
  x: z.coerce.number().min(0).max(100).optional(),
  y: z.coerce.number().min(0).max(100).optional(),
});

const createCampsiteSchema = z.object({
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID"),
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  siteNumber: z.string().trim().min(1, "Site number is required"),
  type: z.enum(["tent", "rv", "cabin", "glamping", "group"]),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional(),
  images: z.array(z.string().trim().url("Image URLs must be valid")).optional(),
  capacity: capacitySchema,
  amenities: z.array(z.string().trim()).optional(),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative"),
  weekendPrice: z.coerce.number().min(0, "Weekend price cannot be negative").optional(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  mapCoordinates: mapCoordinatesSchema.optional(),
  features: z.array(z.string().trim()).optional(),
});

const updateCampsiteSchema = createCampsiteSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const campsiteListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  campground: z.string().regex(/^[a-f\d]{24}$/i, "Invalid campground ID").optional(),
  type: z.enum(["tent", "rv", "cabin", "glamping", "group"]).optional(),
  amenities: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value;
  }, z.array(z.string().trim()).optional()),
  features: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value;
  }, z.array(z.string().trim()).optional()),
  isActive: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  isAvailable: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["name", "basePrice", "weekendPrice", "rating", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", validate(campsiteListSchema, "query"), campsiteController.listCampsites);
router.get("/:id", validate(mongoIdSchema, "params"), campsiteController.getCampsite);

router.post(
  "/",
  authenticate,
  authorize("manager", "admin"),
  validate(createCampsiteSchema),
  campsiteController.createCampsite,
);

router.patch(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateCampsiteSchema),
  campsiteController.updateCampsite,
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  campsiteController.deleteCampsite,
);

export default router;
