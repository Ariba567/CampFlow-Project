import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema, paginationSchema } from "../middleware/validate";
import * as customerController from "../controllers/customerController";

const router = Router();

const addressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

const createCustomerSchema = z.object({
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

const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  "You must provide at least one field to update.",
);

const customerListSchema = paginationSchema.extend({
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

router.get("/", authenticate, authorize("admin"), validate(customerListSchema, "query"), customerController.listCustomers);
router.get("/:id", authenticate, validate(mongoIdSchema, "params"), customerController.getCustomer);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCustomerSchema),
  customerController.createCustomer,
);

router.patch(
  "/:id",
  authenticate,
  validate(mongoIdSchema, "params"),
  validate(updateCustomerSchema),
  customerController.updateCustomer,
);

router.delete("/:id", authenticate, validate(mongoIdSchema, "params"), customerController.deleteCustomer);

export default router;
