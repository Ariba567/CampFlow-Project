import mongoose from "mongoose";
import Reservation, { IReservation, ReservationStatus } from "../models/Reservation";
import Campsite from "../models/Campsite";
import Campground from "../models/Campground";
import { UserRole } from "../models/User";

export interface ReservationCreateInput {
  campsite: string;
  campground: string;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    children?: number;
    vehicles?: number;
  };
  pricing: {
    baseRate: number;
    nights: number;
    subtotal: number;
    taxes?: number;
    fees?: number;
    discount?: number;
    total: number;
  };
  specialRequests?: string;
  status?: ReservationStatus;
}

export type ReservationUpdateInput = Partial<ReservationCreateInput> & {
  cancellationReason?: string;
};

export interface ReservationQueryOptions {
  page: number;
  limit: number;
  sort?: "createdAt" | "checkIn" | "checkOut" | "status" | "total";
  order: "asc" | "desc";
  search?: string;
  reservationNumber?: string;
  campground?: string;
  campsite?: string;
  customer?: string;
  status?: ReservationStatus[];
  checkInFrom?: Date;
  checkInTo?: Date;
  checkOutFrom?: Date;
  checkOutTo?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: ReservationQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (options.reservationNumber) {
    filters.reservationNumber = new RegExp(`^${options.reservationNumber.trim()}`, "i");
  }

  if (options.campground && mongoose.isValidObjectId(options.campground)) {
    filters.campground = new mongoose.Types.ObjectId(options.campground);
  }

  if (options.campsite && mongoose.isValidObjectId(options.campsite)) {
    filters.campsite = new mongoose.Types.ObjectId(options.campsite);
  }

  if (options.customer && mongoose.isValidObjectId(options.customer)) {
    filters.customer = new mongoose.Types.ObjectId(options.customer);
  }

  if (options.status?.length) {
    filters.status = { $in: options.status };
  }

  if (options.checkInFrom) {
    filters.checkIn = { ...(filters.checkIn as Record<string, unknown>), $gte: options.checkInFrom };
  }

  if (options.checkInTo) {
    filters.checkIn = { ...(filters.checkIn as Record<string, unknown>), $lte: options.checkInTo };
  }

  if (options.checkOutFrom) {
    filters.checkOut = { ...(filters.checkOut as Record<string, unknown>), $gte: options.checkOutFrom };
  }

  if (options.checkOutTo) {
    filters.checkOut = { ...(filters.checkOut as Record<string, unknown>), $lte: options.checkOutTo };
  }

  if (typeof options.minTotal === "number") {
    filters["pricing.total"] = { ...(filters["pricing.total"] as Record<string, unknown>), $gte: options.minTotal };
  }

  if (typeof options.maxTotal === "number") {
    filters["pricing.total"] = { ...(filters["pricing.total"] as Record<string, unknown>), $lte: options.maxTotal };
  }

  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(term, "i");
    filters.$or = [
      { reservationNumber: regex },
      { specialRequests: regex },
    ];
  }

  return filters;
}

function buildSort(options: ReservationQueryOptions): Record<string, number> {
  const map: Record<string, string> = {
    createdAt: "createdAt",
    checkIn: "checkIn",
    checkOut: "checkOut",
    status: "status",
    total: "pricing.total",
  };

  const field = options.sort ? map[options.sort] : "createdAt";
  return { [field]: options.order === "asc" ? 1 : -1 };
}

async function getManagerCampgroundIds(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id");
  return campgrounds.map((campground) => campground._id);
}

export async function listReservations(
  options: ReservationQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<IReservation>> {
  const filters = buildFilters(options);

  if (userRole === "customer") {
    filters.customer = new mongoose.Types.ObjectId(userId);
  }

  if (userRole === "manager") {
    const ownedCampgrounds = await getManagerCampgroundIds(userId);
    if (options.campground && !ownedCampgrounds.some((id) => id.equals(options.campground))) {
      throw Object.assign(new Error("Access denied. You can only view reservations for your own campgrounds."), {
        status: 403,
      });
    }

    if (ownedCampgrounds.length === 0) {
      return { data: [], total: 0, page: options.page, limit: options.limit, totalPages: 1 };
    }

    filters.campground = { $in: ownedCampgrounds };
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const query = Reservation.find(filters)
       .sort(sort as any)
    .skip(skip)
    .limit(options.limit)
    .populate("customer", "firstName lastName email")
    .populate("campsite", "name siteNumber type basePrice")
    .populate("campground", "name slug address manager");

  const [data, total] = await Promise.all([query.exec(), Reservation.countDocuments(filters)]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getReservationById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<IReservation> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid reservation ID."), { status: 400 });
  }

  const reservation = await Reservation.findById(id)
    .populate("customer", "firstName lastName email")
    .populate("campsite", "name siteNumber type basePrice")
    .populate("campground", "name slug address manager");

  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (userRole === "customer" && String(reservation.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own reservations."), { status: 403 });
  }

  if (userRole === "manager") {
    const campground = (reservation.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only view reservations for your own campgrounds."), {
        status: 403,
      });
    }
  }

  return reservation;
}

async function ensureCampsiteAndCampgroundMatch(
  campsiteId: string,
  campgroundId: string,
): Promise<void> {
  const campsite = await Campsite.findById(campsiteId).select("campground");
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  if (!campsite.campground || String(campsite.campground) !== campgroundId) {
    throw Object.assign(new Error("The campsite does not belong to the specified campground."), {
      status: 400,
    });
  }
}

async function ensureManagerOwnsCampground(userId: string, campgroundId: string): Promise<void> {
  const campground = await Campground.findById(campgroundId).select("manager");
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  if (String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only manage reservations for your own campgrounds."), {
      status: 403,
    });
  }
}

export async function createReservation(
  input: ReservationCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReservation> {
  await ensureCampsiteAndCampgroundMatch(input.campsite, input.campground);

  if (userRole === "manager") {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  return Reservation.create({
    ...input,
    customer: new mongoose.Types.ObjectId(userId),
  });
}

export async function updateReservation(
  id: string,
  input: ReservationUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReservation> {
  const reservation = await Reservation.findById(id)
    .populate("campground", "manager")
    .populate("customer", "_id");

  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (userRole === "customer" && String(reservation.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only update your own reservations."), {
      status: 403,
    });
  }

  if (userRole === "manager") {
    const campground = (reservation.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update reservations for your own campgrounds."), {
        status: 403,
      });
    }
  }

  if (input.campsite || input.campground) {
    const campsiteId = input.campsite ? input.campsite : String(reservation.campsite);
    const campgroundId = input.campground ? input.campground : String(reservation.campground);
    await ensureCampsiteAndCampgroundMatch(campsiteId, campgroundId);
  }

  if (userRole === "manager" && input.campground) {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  Object.assign(reservation, input);

  await reservation.save();
  return reservation;
}

export async function deleteReservation(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const reservation = await Reservation.findById(id)
    .populate("campground", "manager")
    .populate("customer", "_id");

  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (userRole === "customer" && String(reservation.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only delete your own reservations."), {
      status: 403,
    });
  }

  if (userRole === "manager") {
    const campground = (reservation.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only delete reservations for your own campgrounds."), {
        status: 403,
      });
    }
  }

  await reservation.deleteOne();
}
