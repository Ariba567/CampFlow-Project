import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as campgroundController from "../controllers/campgroundController";

const router = Router();

const locationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "Zip code is required"),
  country: z.string().trim().default("US"),
});

const operatingHoursSchema = z.object({
  checkIn: z.string().regex(/^\d{2}:\d{2}$/, "Check-in must be a valid HH:mm time").optional(),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/, "Check-out must be a valid HH:mm time").optional(),
  open: z.string().regex(/^\d{2}:\d{2}$/, "Open time must be a valid HH:mm time").optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Close time must be a valid HH:mm time").optional(),
});

const createCampgroundSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description cannot exceed 5000 characters"),
  shortDescription: z.string().trim().max(300, "Short description cannot exceed 300 characters").optional(),
  location: locationSchema,
  address: addressSchema,
  phone: z.string().trim().min(7, "Phone number is required"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  website: z.string().trim().url("Please provide a valid website URL").optional(),
  images: z.array(z.string().trim().url("Images must be valid URLs")).optional(),
  coverImage: z.string().trim().url("Cover image must be a valid URL").optional(),
  amenities: z.array(z.string().trim()).optional(),
  categories: z.array(
    z.enum(["tent", "rv", "cabin", "glamping", "group"]),
  ).min(1, "At least one campground category is required"),
  tags: z.array(z.string().trim()).optional(),
  operatingHours: operatingHoursSchema.optional(),
  rules: z.array(z.string().trim()).optional(),
  petPolicy: z
    .enum(["allowed", "not_allowed", "restricted"])
    .default("restricted"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  totalSites: z.coerce.number().int().min(0).default(0),
});

const updateCampgroundSchema = createCampgroundSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const campgroundListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  categories: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      return value;
    }, z.array(z.string().trim()).optional()),
  tags: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      return value;
    }, z.array(z.string().trim()).optional()),
  amenities: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      return value;
    }, z.array(z.string().trim()).optional()),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  manager: z.string().regex(/^[a-f\d]{24}$/i, "Invalid manager ID").optional(),
  isActive: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  isFeatured: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["name", "rating", "totalSites", "createdAt", "isFeatured"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get(
  "/",
  validate(campgroundListSchema, "query"),
  campgroundController.listCampgrounds,
);

router.get(
  "/:id",
  validate(mongoIdSchema, "params"),
  campgroundController.getCampground,
);

router.post(
  "/",
  authenticate,
  authorize("manager", "admin"),
  validate(createCampgroundSchema),
  campgroundController.createCampground,
);

router.patch(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  validate(updateCampgroundSchema),
  campgroundController.updateCampground,
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager", "admin"),
  validate(mongoIdSchema, "params"),
  campgroundController.deleteCampground,
);

export default router;
