import mongoose from "mongoose";
import Reservation, { IReservation, ReservationStatus } from "../models/Reservation";
import Campsite, { ICampsite } from "../models/Campsite";
import Campground from "../models/Campground";
import Pricing, { PricingType, SiteTypeEnum } from "../models/Pricing";
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

async function ensureReservationDoesNotOverlap(
  campsiteId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string,
): Promise<void> {
  if (!mongoose.isValidObjectId(campsiteId)) {
    throw Object.assign(new Error("Invalid campsite ID."), { status: 400 });
  }

  const filters: Record<string, unknown> = {
    campsite: new mongoose.Types.ObjectId(campsiteId),
    status: { $ne: "cancelled" },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeReservationId && mongoose.isValidObjectId(excludeReservationId)) {
    filters._id = { $ne: new mongoose.Types.ObjectId(excludeReservationId) };
  }

  const conflict = await Reservation.findOne(filters).select("checkIn checkOut reservationNumber status").exec();
  if (conflict) {
    throw Object.assign(
      new Error("The selected campsite is already booked for the requested dates."),
      { status: 409 },
    );
  }
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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ─── Holiday date logic ────────────────────────────────────────────────────────
// Specific calendar dates treated as Holiday rate per booking requirements.
// New Year's Day (Jan 1), Christmas (Dec 25), and the specified Easter Sundays.
const HOLIDAY_DATES_ISO = new Set([
  // New Year's Day (Jan 1) across the active window
  "2024-01-01", "2025-01-01", "2026-01-01", "2027-01-01", "2028-01-01", "2029-01-01", "2030-01-01",
  // Christmas (Dec 25)
  "2024-12-25", "2025-12-25", "2026-12-25", "2027-12-25", "2028-12-25", "2029-12-25", "2030-12-25",
  // Easter Sunday
  "2024-03-31", "2025-04-20", "2026-04-05",
  "2027-03-28", "2028-04-16", "2029-04-01", "2030-04-21",
]);

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isHoliday(date: Date): boolean {
  // New Year's Eve (Dec 31) is a fixed month/day match that applies every year.
  if (date.getMonth() === 11 && date.getDate() === 31) return true;
  return HOLIDAY_DATES_ISO.has(toLocalDateKey(date));
}

// Map a campsite type to the rule type used when looking up the nightly rate.
function ruleTypeFor(date: Date): PricingType {
  if (isHoliday(date)) return "holiday";
  const day = date.getDay();
  if (day === 0 || day === 6) return "weekend";
  return "seasonal";
}

export interface ReservationQuote {
  campground: string;
  campsite: string;
  siteType: string;
  nights: number;
  nightBreakdown: Array<{ date: string; rateLabel: string; rate: number }>;
  baseRate: number;
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
}

// Look up the applicable flat rate for a campground + site type + date from the
// Pricing collection. Throws a clear error if no rule exists for that site.
async function getNightlyRateFromPricing(
  campgroundId: mongoose.Types.ObjectId,
  siteType: string,
  date: Date,
): Promise<{ rate: number; label: string }> {
  const ruleType = ruleTypeFor(date);
  const rule = await Pricing.findOne({
    campground: campgroundId,
    siteType: siteType as SiteTypeEnum,
    type: ruleType,
    isActive: true,
    startDate: { $lte: date },
    endDate: { $gte: date },
  })
    .sort({ priority: -1 })
    .lean()
    .exec();

  if (!rule) {
    throw Object.assign(
      new Error("No pricing configured for this site."),
      { status: 400 },
    );
  }

  const rate = rule.applyMode === "multiplier" ? (rule.multiplier ?? 1) * (rule.flatRate ?? 0) : (rule.flatRate ?? 0);
  const label = rule.type === "holiday" ? "Holiday" : rule.type === "weekend" ? "Weekend" : "Regular";

  return { rate, label };
}

// Calculate a reservation quote, evaluating EACH night separately against the
// Pricing collection and summing the nightly rates. This is async because it
// queries Pricing per night. Exported so both the create flow and the quote
// endpoint can share the exact same logic.
export async function calculateReservationPricing(
  campsite: Pick<ICampsite, "campground" | "type">,
  campsiteId: string,
  campgroundId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<ReservationQuote> {
  if (checkOut <= checkIn) {
    throw Object.assign(new Error("Check-out date must be after check-in date."), { status: 400 });
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
  if (nights <= 0) {
    throw Object.assign(new Error("Check-out date must be after check-in date."), { status: 400 });
  }

  const campgroundObjId = new mongoose.Types.ObjectId(campgroundId);
  const siteType = campsite.type;
  const nightBreakdown: ReservationQuote["nightBreakdown"] = [];
  let subtotal = 0;

  const current = new Date(checkIn);
  for (let i = 0; i < nights; i += 1) {
    const { rate, label } = await getNightlyRateFromPricing(campgroundObjId, siteType, current);
    subtotal += rate;
    nightBreakdown.push({ date: toLocalDateKey(current), rateLabel: label, rate });
    current.setDate(current.getDate() + 1);
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const taxes = Math.round(subtotal * 0.1 * 100) / 100;
  const total = Math.round((subtotal + taxes) * 100) / 100;

  return {
    campground: campgroundId,
    campsite: campsiteId,
    siteType,
    nights,
    nightBreakdown,
    baseRate: subtotal,
    subtotal,
    taxes,
    fees: 0,
    discount: 0,
    total,
  };
}

// Non-destructive availability check: validates the campsite belongs to the
// campground and that no un-cancelled reservation overlaps the requested dates.
// Reuses the exact same overlap logic used when creating a reservation, but does
// NOT create or modify any reservation. Throws a 409 on conflict.
export async function checkReservationAvailability(input: {
  campsite: string;
  campground: string;
  checkIn: Date;
  checkOut: Date;
}): Promise<{ available: true; message: string }> {
  await ensureCampsiteAndCampgroundMatch(input.campsite, input.campground);

  if (input.checkOut <= input.checkIn) {
    throw Object.assign(new Error("Check-out date must be after check-in date."), { status: 400 });
  }

  await ensureReservationDoesNotOverlap(input.campsite, input.checkIn, input.checkOut);

  return { available: true, message: "Available for these dates" };
}

// Public quote entrypoint: given a campsite + campground + dates, return the
// calculated pricing breakdown from the Pricing rules collection.
export async function quoteReservation(input: {
  campsite: string;
  campground: string;
  checkIn: Date;
  checkOut: Date;
}): Promise<ReservationQuote> {
  await ensureCampsiteAndCampgroundMatch(input.campsite, input.campground);

  const campsite = await Campsite.findById(input.campsite).select("campground type").lean<Pick<ICampsite, "_id" | "campground" | "type">>().exec();
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  return calculateReservationPricing(campsite, input.campsite, input.campground, input.checkIn, input.checkOut);
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

await ensureReservationDoesNotOverlap(input.campsite, input.checkIn, input.checkOut);

  const campsite = await Campsite.findById(input.campsite).select("campground type").exec();
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  const quote = await calculateReservationPricing(campsite, input.campsite, input.campground, input.checkIn, input.checkOut);
  const pricing = {
    baseRate: quote.baseRate,
    nights: quote.nights,
    subtotal: quote.subtotal,
    taxes: quote.taxes,
    fees: quote.fees,
    discount: quote.discount,
    total: quote.total,
  };

  return Reservation.create({
    customer: new mongoose.Types.ObjectId(userId),
    campsite: new mongoose.Types.ObjectId(input.campsite),
    campground: new mongoose.Types.ObjectId(input.campground),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    specialRequests: input.specialRequests,
    status: "pending",
    pricing,
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

  if (userRole === "customer") {
    const disallowedFields: Array<keyof ReservationUpdateInput> = [
      "status",
      "campground",
      "campsite",
      "pricing",
      "cancellationReason",
    ];

    for (const field of disallowedFields) {
      if (field in input && input[field] !== undefined) {
        throw Object.assign(new Error("Customers may not modify reservation status, campsite, campground, pricing, or cancellation details."), {
          status: 403,
        });
      }
    }
  }

  let updatedCampsiteId = String(reservation.campsite);
  let updatedCampgroundId = String(reservation.campground);
  let updatedCheckIn = reservation.checkIn;
  let updatedCheckOut = reservation.checkOut;

  if (input.campsite) {
    updatedCampsiteId = input.campsite;
  }
  if (input.campground) {
    updatedCampgroundId = input.campground;
  }
  if (input.checkIn) {
    updatedCheckIn = input.checkIn;
  }
  if (input.checkOut) {
    updatedCheckOut = input.checkOut;
  }

  if (input.campsite || input.campground || input.checkIn || input.checkOut) {
    await ensureCampsiteAndCampgroundMatch(updatedCampsiteId, updatedCampgroundId);
    await ensureReservationDoesNotOverlap(updatedCampsiteId, updatedCheckIn, updatedCheckOut, id);

const campsite = await Campsite.findById(updatedCampsiteId).select("campground type").exec();
    if (!campsite) {
      throw Object.assign(new Error("Campsite not found."), { status: 404 });
    }

    if (!campsite.campground || String(campsite.campground) !== updatedCampgroundId) {
      throw Object.assign(new Error("The campsite does not belong to the specified campground."), {
        status: 400,
      });
    }

    const quote = await calculateReservationPricing(campsite, updatedCampsiteId, updatedCampgroundId, updatedCheckIn, updatedCheckOut);
    reservation.pricing = {
      baseRate: quote.baseRate,
      nights: quote.nights,
      subtotal: quote.subtotal,
      taxes: quote.taxes,
      fees: quote.fees,
      discount: quote.discount,
      total: quote.total,
    };
    reservation.campsite = new mongoose.Types.ObjectId(updatedCampsiteId);
    reservation.campground = new mongoose.Types.ObjectId(updatedCampgroundId);
    reservation.checkIn = updatedCheckIn;
    reservation.checkOut = updatedCheckOut;
  }

  if (userRole === "manager" && input.campground) {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  if (input.guests) {
    reservation.guests = {
      adults: input.guests.adults ?? reservation.guests.adults,
      children: input.guests.children ?? reservation.guests.children,
      vehicles: input.guests.vehicles ?? reservation.guests.vehicles,
    };
  }

  if (input.specialRequests !== undefined) {
    reservation.specialRequests = input.specialRequests;
  }

  if (userRole !== "customer" && input.status !== undefined) {
    reservation.status = input.status;
  }

  if (input.cancellationReason !== undefined) {
    reservation.cancellationReason = input.cancellationReason;
  }

  await reservation.save();
  return reservation;
}

export async function cancelReservation(
  id: string,
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
    throw Object.assign(new Error("Access denied. You can only cancel your own reservations."), {
      status: 403,
    });
  }

  if (userRole === "manager") {
    const campground = (reservation.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only cancel reservations for your own campgrounds."), {
        status: 403,
      });
    }
  }

  if (reservation.status === "completed") {
    throw Object.assign(new Error("Completed reservations cannot be cancelled."), { status: 400 });
  }

  if (reservation.status === "cancelled") {
    throw Object.assign(new Error("This reservation has already been cancelled."), { status: 400 });
  }

  reservation.status = "cancelled";
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = new mongoose.Types.ObjectId(userId);
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
