import mongoose from "mongoose";
import Review, { IReview } from "../models/Review";
import Reservation, { ReservationStatus } from "../models/Reservation";
import Campground from "../models/Campground";
import Campsite from "../models/Campsite";
import { UserRole } from "../models/User";

export interface ReviewCreateInput {
  campground: string;
  campsite?: string;
  reservation: string;
  overallRating: number;
  ratingBreakdown: {
    cleanliness: number;
    facilities: number;
    location: number;
    value: number;
    staff: number;
  };
  title: string;
  body: string;
  images?: string[];
  ownerResponse?: string;
  isApproved?: boolean;
  isHidden?: boolean;
}

export type ReviewUpdateInput = Partial<ReviewCreateInput>;

export interface ReviewQueryOptions {
  page: number;
  limit: number;
  sort?: "createdAt" | "overallRating" | "helpfulVotes";
  order: "asc" | "desc";
  search?: string;
  campground?: string;
  campsite?: string;
  reservation?: string;
  customer?: string;
  isApproved?: boolean;
  isHidden?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: ReviewQueryOptions) {
  const filters: Record<string, unknown> = {};

  if (options.campground && mongoose.isValidObjectId(options.campground)) {
    filters.campground = new mongoose.Types.ObjectId(options.campground);
  }

  if (options.campsite && mongoose.isValidObjectId(options.campsite)) {
    filters.campsite = new mongoose.Types.ObjectId(options.campsite);
  }

  if (options.reservation && mongoose.isValidObjectId(options.reservation)) {
    filters.reservation = new mongoose.Types.ObjectId(options.reservation);
  }

  if (options.customer && mongoose.isValidObjectId(options.customer)) {
    filters.customer = new mongoose.Types.ObjectId(options.customer);
  }

  if (typeof options.isApproved === "boolean") {
    filters.isApproved = options.isApproved;
  }

  if (typeof options.isHidden === "boolean") {
    filters.isHidden = options.isHidden;
  }

  if (typeof options.minRating === "number" || typeof options.maxRating === "number") {
    filters.overallRating = {} as Record<string, number>;
    if (typeof options.minRating === "number") {
      (filters.overallRating as Record<string, number>).$gte = options.minRating;
    }
    if (typeof options.maxRating === "number") {
      (filters.overallRating as Record<string, number>).$lte = options.maxRating;
    }
  }

  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(term, "i");
    filters.$or = [
      { title: regex },
      { body: regex },
      { ownerResponse: regex },
    ];
  }

  return filters;
}

function buildSort(options: ReviewQueryOptions): Record<string, number> {
  const field = options.sort === "overallRating"
    ? "overallRating"
    : options.sort === "helpfulVotes"
      ? "helpfulVotes"
      : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

async function getManagerCampgroundIds(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id");
  return campgrounds.map((campground) => campground._id);
}

export async function listReviews(
  options: ReviewQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<IReview>> {
  const filters = buildFilters(options);

  if (userRole === "customer") {
    filters.customer = new mongoose.Types.ObjectId(userId);
  }

  if (userRole === "manager") {
    const ownedCampgrounds = await getManagerCampgroundIds(userId);
    if (ownedCampgrounds.length === 0) {
      return { data: [], total: 0, page: options.page, limit: options.limit, totalPages: 1 };
    }

    if (options.campground && !ownedCampgrounds.some((id) => id.equals(options.campground))) {
      throw Object.assign(new Error("Access denied. You can only view reviews for your own campgrounds."), {
        status: 403,
      });
    }

    filters.campground = { $in: ownedCampgrounds };
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Review.find(filters)
      .sort(sort as any)
      .skip(skip)
      .limit(options.limit)
      .populate("customer", "firstName lastName email")
      .populate("campground", "name slug")
      .populate("campsite", "name siteNumber")
      .populate("reservation", "reservationNumber")
      .exec(),
    Review.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getReviewById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<IReview> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid review ID."), { status: 400 });
  }

  const review = await Review.findById(id)
    .populate("customer", "firstName lastName email")
    .populate("campground", "name slug manager")
    .populate("campsite", "name siteNumber")
    .populate("reservation", "reservationNumber")
    .exec();

  if (!review) {
    throw Object.assign(new Error("Review not found."), { status: 404 });
  }

  if (userRole === "customer" && String(review.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own reviews."), { status: 403 });
  }

  if (userRole === "manager") {
    const campground = (review.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only view reviews for your own campgrounds."), {
        status: 403,
      });
    }
  }

  return review;
}

async function ensureReservationBelongsToCustomer(reservationId: string, userId: string) {
  const reservation = await Reservation.findById(reservationId).select("customer campground campsite");
  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (String(reservation.customer) !== userId) {
    throw Object.assign(new Error("Access denied. You can only review your own reservations."), { status: 403 });
  }

  return reservation;
}

async function validateReviewRelations(
  campgroundId: string,
  campsiteId: string | undefined,
  reservationId: string,
): Promise<void> {
  const reservation = await Reservation.findById(reservationId).select("campground campsite");
  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (String(reservation.campground) !== campgroundId) {
    throw Object.assign(new Error("The reservation does not belong to the specified campground."), {
      status: 400,
    });
  }

  if (campsiteId) {
    if (!reservation.campsite || String(reservation.campsite) !== campsiteId) {
      throw Object.assign(new Error("The reservation does not belong to the specified campsite."), {
        status: 400,
      });
    }

    const campsite = await Campsite.findById(campsiteId).select("campground");
    if (!campsite) {
      throw Object.assign(new Error("Campsite not found."), { status: 404 });
    }

    if (String(campsite.campground) !== campgroundId) {
      throw Object.assign(new Error("The campsite does not belong to the specified campground."), {
        status: 400,
      });
    }
  }
}

async function ensureManagerOwnsCampground(userId: string, campgroundId: string): Promise<void> {
  const campground = await Campground.findById(campgroundId).select("manager");
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  if (String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only manage reviews for your own campgrounds."), {
      status: 403,
    });
  }
}

export async function createReview(
  input: ReviewCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReview> {
  if (userRole === "customer") {
    const reservation = await ensureReservationBelongsToCustomer(input.reservation, userId);
    if (String(reservation.campground) !== input.campground) {
      throw Object.assign(new Error("The reservation does not belong to the specified campground."), {
        status: 400,
      });
    }
    if (input.campsite && reservation.campsite && String(reservation.campsite) !== input.campsite) {
      throw Object.assign(new Error("The reservation does not belong to the specified campsite."), {
        status: 400,
      });
    }
  }

  await validateReviewRelations(input.campground, input.campsite, input.reservation);

  return Review.create({
    ...input,
    customer: new mongoose.Types.ObjectId(userId),
  });
}

export async function updateReview(
  id: string,
  input: ReviewUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReview> {
  const review = await Review.findById(id).populate("campground", "manager").populate("customer", "_id").exec();
  if (!review) {
    throw Object.assign(new Error("Review not found."), { status: 404 });
  }

  if (userRole === "customer" && String(review.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only update your own reviews."), { status: 403 });
  }

  if (userRole === "manager") {
    const campground = (review.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update reviews for your own campgrounds."), {
        status: 403,
      });
    }
  }

  if (input.reservation || input.campground || input.campsite) {
    const campgroundId = input.campground ? input.campground : String(review.campground._id);
    const campsiteId = input.campsite ? input.campsite : review.campsite ? String(review.campsite) : undefined;
    const reservationId = input.reservation ? input.reservation : String(review.reservation);
    await validateReviewRelations(campgroundId, campsiteId, reservationId);
  }

  if (userRole === "manager" && input.campground) {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  Object.assign(review, input);
  await review.save();
  return review;
}

export async function deleteReview(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const review = await Review.findById(id).populate("campground", "manager").populate("customer", "_id").exec();
  if (!review) {
    throw Object.assign(new Error("Review not found."), { status: 404 });
  }

  if (userRole === "customer" && String(review.customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only delete your own reviews."), { status: 403 });
  }

  if (userRole === "manager") {
    const campground = (review.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only delete reviews for your own campgrounds."), {
        status: 403,
      });
    }
  }

  await review.deleteOne();
}
