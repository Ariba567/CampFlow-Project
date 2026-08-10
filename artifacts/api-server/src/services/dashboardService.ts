import mongoose from "mongoose";
import Reservation from "../models/Reservation";
import Payment from "../models/Payment";
import Notification from "../models/Notification";
import Campground from "../models/Campground";
import Campsite from "../models/Campsite";
import Activity from "../models/Activity";
import Review from "../models/Review";
import User from "../models/User";
import { UserRole } from "../models/User";

// Utility pagination default
const defaultLimit = 20;

// ----------------- Customer dashboards -----------------
export async function getCustomerSummary(userId: string) {
  const upcomingCount = await Reservation.countDocuments({ customer: userId, status: { $in: ["pending", "confirmed"] } });
  const pastCount = await Reservation.countDocuments({ customer: userId, status: { $in: ["completed", "cancelled"] } });
  const unreadNotifications = await Notification.countDocuments({ recipient: userId, isRead: false });
  const paymentsPending = await Payment.countDocuments({ customer: userId, status: "pending" });

  return {
    upcomingReservations: upcomingCount,
    pastReservations: pastCount,
    unreadNotifications,
    pendingPayments: paymentsPending,
  };
}

export async function getCustomerProfile(userId: string) {
  const user = await User.findById(userId).select("firstName lastName fullName email phone avatar bio favorites createdAt").exec();
  if (!user) throw Object.assign(new Error("User not found."), { status: 404 });
  return user;
}

export async function listCustomerReservations(userId: string, options: { page: number; limit: number; sort: string; order: "asc" | "desc"; status?: string[]; upcoming?: boolean; }) {
  const filters: Record<string, unknown> = { customer: new mongoose.Types.ObjectId(userId) };

  if (options.status && options.status.length) filters.status = { $in: options.status };
  if (options.upcoming) filters.checkIn = { $gte: new Date() };

  const sortField = options.sort || "createdAt";
  const sort = { [sortField]: options.order === "asc" ? 1 : -1 } as unknown as mongoose.SortOrder;
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Reservation.find(filters)
      .sort(sort as any)
      .skip(skip)
      .limit(options.limit)
      .populate("campsite", "name siteNumber")
      .populate("campground", "name slug")
      .exec(),
    Reservation.countDocuments(filters),
  ]);

  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function listCustomerFavorites(userId: string, options: { page: number; limit: number; }) {
  const user = await User.findById(userId).select("favorites").populate({ path: "favorites", select: "name siteNumber campground" }).exec();
  if (!user) throw Object.assign(new Error("User not found."), { status: 404 });
  const start = (options.page - 1) * options.limit;
  const items = (user.favorites || []).slice(start, start + options.limit);
  return { data: items, total: user.favorites.length, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil((user.favorites.length || 0) / options.limit), 1) };
}

export async function addCustomerFavorite(userId: string, campsiteId: string) {
  if (!mongoose.isValidObjectId(campsiteId)) {
    throw Object.assign(new Error("Invalid campsite ID."), { status: 400 });
  }

  const campsite = await Campsite.findById(campsiteId).select("_id").exec();
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: campsite._id } },
    { new: true },
  ).exec();

  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }

  return user;
}

export async function removeCustomerFavorite(userId: string, campsiteId: string) {
  if (!mongoose.isValidObjectId(campsiteId)) {
    throw Object.assign(new Error("Invalid campsite ID."), { status: 400 });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { favorites: new mongoose.Types.ObjectId(campsiteId) } },
    { new: true },
  ).exec();

  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }

  return user;
}

export async function listCustomerActivities(userId: string, options: { page: number; limit: number; }) {
  const reservations = await Reservation.find({ customer: userId }).select("_id");
  const reservationIds = reservations.map((r) => r._id);
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Activity.find({ reservation: { $in: reservationIds } }).skip(skip).limit(options.limit).exec(),
    Activity.countDocuments({ reservation: { $in: reservationIds } }),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function listCustomerNotifications(userId: string, options: { page: number; limit: number; }) {
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Notification.find({ recipient: userId }).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    Notification.countDocuments({ recipient: userId }),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function listCustomerPayments(userId: string, options: { page: number; limit: number; }) {
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Payment.find({ customer: userId }).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    Payment.countDocuments({ customer: userId }),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function getCustomerDashboardStats(userId: string) {
  const totalReservations = await Reservation.countDocuments({ customer: userId });
  const totalPayments = await Payment.countDocuments({ customer: userId, status: "completed" });
  const totalNotifications = await Notification.countDocuments({ recipient: userId });
  return { totalReservations, totalPayments, totalNotifications };
}

export async function listCustomerReviews(userId: string, options: { page: number; limit: number; }) {
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Review.find({ customer: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate("campground", "name slug")
      .populate("customer", "firstName lastName email")
      .exec(),
    Review.countDocuments({ customer: userId }),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

// ----------------- Manager dashboards -----------------
export async function getManagerSummary(userId: string) {
  // campgrounds owned by manager
  const campgrounds = await Campground.find({ manager: userId }).select("_id").exec();
  const campgroundIds = campgrounds.map((c) => c._id);

  const upcomingReservations = await Reservation.countDocuments({ campground: { $in: campgroundIds }, checkIn: { $gte: new Date() } });
  const pendingReservations = await Reservation.countDocuments({ campground: { $in: campgroundIds }, status: "pending" });
  const unreadNotifications = await Notification.countDocuments({ recipient: userId, isRead: false });
  const revenue = await Payment.aggregate([
    { $match: { reservation: { $exists: true } } },
    { $lookup: { from: "reservations", localField: "reservation", foreignField: "_id", as: "res" } },
    { $unwind: { path: "$res", preserveNullAndEmptyArrays: true } },
    { $match: { "res.campground": { $in: campgroundIds } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).exec();

  return {
    upcomingReservations,
    pendingReservations,
    unreadNotifications,
    revenue: (revenue[0] && revenue[0].total) || 0,
  };
}

export async function getManagerCampgroundStats(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).exec();
  const stats = await Promise.all(campgrounds.map(async (cg) => {
    const campsites = await Campsite.countDocuments({ campground: cg._id });
    const reservations = await Reservation.countDocuments({ campground: cg._id });
    const revenueAgg = await Payment.aggregate([
      { $lookup: { from: "reservations", localField: "reservation", foreignField: "_id", as: "res" } },
      { $unwind: { path: "$res", preserveNullAndEmptyArrays: true } },
      { $match: { "res.campground": cg._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).exec();
    return { campground: cg, campsites, reservations, revenue: (revenueAgg[0] && revenueAgg[0].total) || 0 };
  }));
  return stats;
}

export async function listManagerCampsiteOccupancy(userId: string, options: { page: number; limit: number; sort?: string; order?: "asc" | "desc" }) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id").exec();
  const cgIds = campgrounds.map((c) => c._id);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Campsite.find({ campground: { $in: cgIds } })
      .skip(skip)
      .limit(options.limit)
      .exec(),
    Campsite.countDocuments({ campground: { $in: cgIds } }),
  ]);

  // calculate simple occupancy rates per campsite (booked nights / possible nights) is complex; provide placeholder counts
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function listManagerReservations(userId: string, options: { page: number; limit: number; status?: string[]; campground?: string; sort?: string; order?: "asc" | "desc" }) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id").exec();
  const cgIds = campgrounds.map((c) => c._id);
  const filters: Record<string, unknown> = { campground: { $in: cgIds } };
  if (options.status) filters.status = { $in: options.status };
  if (options.campground && mongoose.isValidObjectId(options.campground)) filters.campground = options.campground;

  const skip = (options.page - 1) * options.limit;
  const sortField = options.sort || "createdAt";
  const sort = { [sortField]: options.order === "asc" ? 1 : -1 } as unknown as mongoose.SortOrder;

  const [data, total] = await Promise.all([
    Reservation.find(filters).sort(sort as any).skip(skip).limit(options.limit).populate("customer", "firstName lastName email").exec(),
    Reservation.countDocuments(filters),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

export async function getManagerRevenueSummary(userId: string, from?: Date, to?: Date) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id").exec();
  const cgIds = campgrounds.map((c) => c._id);

  const match: Record<string, unknown> = {};
  if (from) match.createdAt = { ...(match.createdAt as Record<string, unknown>), $gte: from };
  if (to) match.createdAt = { ...(match.createdAt as Record<string, unknown>), $lte: to };

  const revenueAgg = await Payment.aggregate([
    { $lookup: { from: "reservations", localField: "reservation", foreignField: "_id", as: "res" } },
    { $unwind: { path: "$res", preserveNullAndEmptyArrays: true } },
    { $match: { "res.campground": { $in: cgIds } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).exec();
  return { revenue: (revenueAgg[0] && revenueAgg[0].total) || 0 };
}

export async function listManagerReviews(userId: string, options: { page: number; limit: number; }) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id").exec();
  const cgIds = campgrounds.map((c) => c._id);
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Review.find({ campground: { $in: cgIds } }).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    Review.countDocuments({ campground: { $in: cgIds } }),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}

// ----------------- Admin dashboards -----------------
export async function getAdminSummary() {
  const totalUsers = await User.countDocuments();
  const totalCustomers = await User.countDocuments({ role: "customer" });
  const totalManagers = await User.countDocuments({ role: "manager" });
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const totalCampgrounds = await Campground.countDocuments();
  const totalCampsites = await Campsite.countDocuments();
  const totalReservations = await Reservation.countDocuments();
  const totalRevenueAgg = await Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).exec();

  return {
    totalUsers,
    totalCustomers,
    totalManagers,
    totalAdmins,
    totalCampgrounds,
    totalCampsites,
    totalReservations,
    totalRevenue: (totalRevenueAgg[0] && totalRevenueAgg[0].total) || 0,
  };
}

export async function listRecentSystemActivity(options: { page: number; limit: number; }) {
  // For simplicity, use notifications as proxy for recent activity and include recent reservations/payments
  const skip = (options.page - 1) * options.limit;
  const [notes, reservations, payments] = await Promise.all([
    Notification.find({}).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    Reservation.find({}).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    Payment.find({}).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
  ]);
  return { notifications: notes, reservations, payments };
}

export async function listAdminUsers(options: { page: number; limit: number; search?: string; role?: string }) {
  const filters: Record<string, unknown> = {};
  if (options.role) filters.role = options.role;
  if (options.search) {
    const regex = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
    filters.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(options.limit).select("firstName lastName email role createdAt").exec(),
    User.countDocuments(filters),
  ]);
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.max(Math.ceil(total / options.limit), 1) };
}
