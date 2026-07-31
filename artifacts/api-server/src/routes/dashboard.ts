import express from "express";
import { z } from "zod";
import * as dashboardController from "../controllers/dashboardController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

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

// Customer routes
router.get("/customer/summary", authenticate, authorize("customer"), dashboardController.customerSummary);
router.get("/customer/profile", authenticate, authorize("customer"), dashboardController.customerProfile);
router.get("/customer/reservations", authenticate, authorize("customer"), validate(paginationSchema), dashboardController.customerReservations);
router.get("/customer/favorites", authenticate, authorize("customer"), validate(paginationSchema), dashboardController.customerFavorites);
router.get("/customer/activities", authenticate, authorize("customer"), validate(paginationSchema), dashboardController.customerActivities);
router.get("/customer/notifications", authenticate, authorize("customer"), validate(paginationSchema), dashboardController.customerNotifications);
router.get("/customer/payments", authenticate, authorize("customer"), validate(paginationSchema), dashboardController.customerPayments);
router.get("/customer/stats", authenticate, authorize("customer"), dashboardController.customerStats);

// Manager routes
router.get("/manager/summary", authenticate, authorize("manager"), dashboardController.managerSummary);
router.get("/manager/campground-stats", authenticate, authorize("manager"), dashboardController.managerCampgroundStats);
router.get("/manager/campsites", authenticate, authorize("manager"), validate(paginationSchema), dashboardController.managerCampsiteOccupancy);
router.get("/manager/reservations", authenticate, authorize("manager"), validate(paginationSchema), dashboardController.managerReservations);
router.get("/manager/revenue", authenticate, authorize("manager"), validate(paginationSchema), dashboardController.managerRevenue);
router.get("/manager/reviews", authenticate, authorize("manager"), validate(paginationSchema), dashboardController.managerReviews);

// Admin routes
router.get("/admin/summary", authenticate, authorize("admin"), dashboardController.adminSummary);
router.get("/admin/recent-activity", authenticate, authorize("admin"), validate(paginationSchema), dashboardController.adminRecentActivity);
router.get("/admin/users", authenticate, authorize("admin"), validate(paginationSchema), dashboardController.adminUsers);

export default router;
