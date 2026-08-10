import express from "express";
import { z } from "zod";
import * as dashboardController from "../controllers/dashboardController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, mongoIdSchema } from "../middleware/validate";

const router = express.Router();

const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  campground: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  upcoming: z.union([z.literal("true"), z.literal("false")]).optional(),
});

const adminUsersListSchema = paginationSchema.extend({
  role: z.enum(["customer", "manager", "admin"]).optional(),
});

// Customer routes
router.get("/customer/summary", authenticate, authorize("customer"), dashboardController.customerSummary);
router.get("/customer/profile", authenticate, authorize("customer"), dashboardController.customerProfile);
router.get("/customer/reservations", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerReservations);
router.get("/customer/favorites", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerFavorites);
router.post("/customer/favorites/:id", authenticate, authorize("customer"), validate(mongoIdSchema, "params"), dashboardController.addCustomerFavorite);
router.delete("/customer/favorites/:id", authenticate, authorize("customer"), validate(mongoIdSchema, "params"), dashboardController.removeCustomerFavorite);
router.get("/customer/activities", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerActivities);
router.get("/customer/notifications", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerNotifications);
router.get("/customer/payments", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerPayments);
router.get("/customer/stats", authenticate, authorize("customer"), dashboardController.customerStats);
router.get("/customer/reviews", authenticate, authorize("customer"), validate(paginationSchema, "query"), dashboardController.customerReviews);

// Manager routes
router.get("/manager/summary", authenticate, authorize("manager"), dashboardController.managerSummary);
router.get("/manager/campground-stats", authenticate, authorize("manager"), dashboardController.managerCampgroundStats);
router.get("/manager/campsites", authenticate, authorize("manager"), validate(paginationSchema, "query"), dashboardController.managerCampsiteOccupancy);
router.get("/manager/reservations", authenticate, authorize("manager"), validate(paginationSchema, "query"), dashboardController.managerReservations);
router.get("/manager/revenue", authenticate, authorize("manager"), validate(paginationSchema, "query"), dashboardController.managerRevenue);
router.get("/manager/reviews", authenticate, authorize("manager"), validate(paginationSchema, "query"), dashboardController.managerReviews);

// Admin routes
router.get("/admin/summary", authenticate, authorize("admin"), dashboardController.adminSummary);
router.get("/admin/recent-activity", authenticate, authorize("admin"), validate(paginationSchema, "query"), dashboardController.adminRecentActivity);
router.get("/admin/users", authenticate, authorize("admin"), validate(adminUsersListSchema, "query"), dashboardController.adminUsers);

export default router;
