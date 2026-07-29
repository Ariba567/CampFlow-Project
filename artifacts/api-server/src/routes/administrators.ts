import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as administratorController from "../controllers/administratorController";

const router = Router();

const addressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

const createAdministratorSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  ),
  phone: z.string().trim().regex(/^[+]?[-\d\s().]{7,20}$/, "Please provide a valid phone number").optional(),
  avatar: z.string().trim().optional(),
  bio: z.string().trim().max(500).optional(),
  address: addressSchema.optional(),
});

const updateAdministratorSchema = createAdministratorSchema.partial().extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const administratorListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  isActive: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" ? true : value === "false" ? false : value;
    }
    return value;
  }, z.boolean().optional()),
  createdFrom: z.preprocess((value) => new Date(value as string), z.date().optional()),
  createdTo: z.preprocess((value) => new Date(value as string), z.date().optional()),
  sort: z.enum(["createdAt", "firstName", "lastName", "email"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

router.get(
  "/",
  authenticate,
  authorize("admin"),
  validate(administratorListSchema, "query"),
  administratorController.listAdministrators,
);
router.get("/:id", authenticate, validate(mongoIdSchema, "params"), administratorController.getAdministrator);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createAdministratorSchema),
  administratorController.createAdministrator,
);

router.patch(
  "/:id",
  authenticate,
  validate(mongoIdSchema, "params"),
  validate(updateAdministratorSchema),
  administratorController.updateAdministrator,
);

router.delete(
  "/:id",
  authenticate,
  validate(mongoIdSchema, "params"),
  administratorController.deleteAdministrator,
);

export default router;
