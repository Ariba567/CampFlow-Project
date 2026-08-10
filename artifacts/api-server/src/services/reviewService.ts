import mongoose from "mongoose";
import Review, { IReview } from "../models/Review";
import Campground from "../models/Campground";
import Reservation from "../models/Reservation";
import User, { UserRole } from "../models/User";

// ─── Input types ─────────────────────────────────────────────────────────────
export interface ReviewCreateInput {
  campground: string;
  reservationId: string;
  rating: number;
  comment: string;
}

export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Recalculate campground aggregate rating ───────────────────────────────────
async function recalculateCampgroundRating(campgroundId: string): Promise<void> {
  const stats = await Review.aggregate([
    { $match: { campground: new mongoose.Types.ObjectId(campgroundId) } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = Math.round((stats[0]?.average ?? 0) * 10) / 10;
  const count = stats[0]?.count ?? 0;

  await Campground.findByIdAndUpdate(campgroundId, {
    "rating.average": average,
    "rating.count": count,
  }).exec();
}

// ─── Check review eligibility for a customer at a campground ─────────────────
export interface EligibilityResult {
  eligible: boolean;
  reservationId: string | null;
}

export async function checkReviewEligibility(
  campgroundId: string,
  customerId: string,
): Promise<EligibilityResult> {
  if (!mongoose.isValidObjectId(campgroundId)) {
    throw Object.assign(new Error("Invalid campground ID."), { status: 400 });
  }

  const reservation = await Reservation.findOne({
    customer: customerId,
    campground: campgroundId,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean()
    .exec();

  if (!reservation) {
    return { eligible: false, reservationId: null };
  }

  return { eligible: true, reservationId: String(reservation._id) };
}

// ─── List reviews by campground (public) ──────────────────────────────────────
export interface CampgroundReviewsResult {
  data: IReview[];
  averageRating: number | null;
  totalReviews: number;
}

export async function listReviewsByCampground(campgroundId: string): Promise<CampgroundReviewsResult> {
  if (!mongoose.isValidObjectId(campgroundId)) {
    throw Object.assign(new Error("Invalid campground ID."), { status: 400 });
  }

  const campground = await Campground.findById(campgroundId).select("_id").exec();
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  const [data, stats] = await Promise.all([
    Review.find({ campground: campgroundId })
      .sort({ createdAt: -1 })
      .populate("customer", "firstName lastName email")
      .exec(),
    Review.aggregate([
      { $match: { campground: new mongoose.Types.ObjectId(campgroundId) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const averageRating = stats[0]?.average ?? null;
  const totalReviews = stats[0]?.count ?? 0;

  return { data, averageRating, totalReviews };
}

// ─── List reviews by customer ─────────────────────────────────────────────────
export async function listReviewsByCustomer(
  customerId: string,
  requestingUserId: string,
  userRole: UserRole,
  options: { page: number; limit: number },
): Promise<PaginatedResult<IReview>> {
  if (!mongoose.isValidObjectId(customerId)) {
    throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
  }

  if (userRole === "customer" && customerId !== requestingUserId) {
    throw Object.assign(new Error("Access denied. You can only view your own reviews."), { status: 403 });
  }

  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    Review.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate("campground", "name slug")
      .populate("customer", "firstName lastName email")
      .exec(),
    Review.countDocuments({ customer: customerId }),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

// ─── Create review (upsert: one per customer per campground) ──────────────────
export async function createReview(
  input: ReviewCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReview> {
  if (userRole !== "customer") {
    throw Object.assign(new Error("Only customers can create reviews."), { status: 403 });
  }

  if (!mongoose.isValidObjectId(input.campground)) {
    throw Object.assign(new Error("Invalid campground ID."), { status: 400 });
  }

  if (!mongoose.isValidObjectId(input.reservationId)) {
    throw Object.assign(new Error("Invalid reservation ID."), { status: 400 });
  }

  const reservation = await Reservation.findById(input.reservationId)
    .select("customer campground status")
    .exec();

  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  if (String(reservation.customer) !== userId) {
    throw Object.assign(new Error("This reservation does not belong to you."), { status: 403 });
  }

  if (String(reservation.campground) !== input.campground) {
    throw Object.assign(new Error("This reservation is not for the specified campground."), { status: 400 });
  }

  if (reservation.status !== "completed") {
    throw Object.assign(new Error("You can only review campgrounds you have completed a stay at."), { status: 403 });
  }

  const campground = await Campground.findById(input.campground).select("_id").exec();
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  const customerObjectId = new mongoose.Types.ObjectId(userId);
  const reservationObjectId = new mongoose.Types.ObjectId(input.reservationId);

  // Upsert: if the customer already has a review for this campground, update it
  const existing = await Review.findOne({
    customer: customerObjectId,
    campground: input.campground,
  }).exec();

  if (existing) {
    existing.rating = input.rating;
    existing.comment = input.comment;
    existing.reservationId = reservationObjectId;
    await existing.save();
  } else {
    const review = await Review.create({
      customer: customerObjectId,
      campground: input.campground,
      reservationId: reservationObjectId,
      rating: input.rating,
      comment: input.comment,
    });
    await recalculateCampgroundRating(input.campground);
    return review.populate("campground", "name slug");
  }

  await recalculateCampgroundRating(input.campground);
  return existing.populate("campground", "name slug");
}

// ─── Update review (only author) ──────────────────────────────────────────────
export async function updateReview(
  id: string,
  input: ReviewUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IReview> {
  if (userRole !== "customer") {
    throw Object.assign(new Error("Only customers can update reviews."), { status: 403 });
  }

  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid review ID."), { status: 400 });
  }

  const review = await Review.findById(id).populate("campground", "manager").exec();
  if (!review) {
    throw Object.assign(new Error("Review not found."), { status: 404 });
  }

  if (String(review.customer) !== userId) {
    throw Object.assign(new Error("Access denied. You can only update your own reviews."), { status: 403 });
  }

  if (input.rating !== undefined) {
    review.rating = input.rating;
  }
  if (input.comment !== undefined) {
    review.comment = input.comment;
  }

  await review.save();
  await recalculateCampgroundRating(String(review.campground._id));

  return review.populate("campground", "name slug");
}

// ─── Delete review (only author) ──────────────────────────────────────────────
export async function deleteReview(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  if (userRole !== "customer") {
    throw Object.assign(new Error("Only customers can delete reviews."), { status: 403 });
  }

  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid review ID."), { status: 400 });
  }

  const review = await Review.findById(id).exec();
  if (!review) {
    throw Object.assign(new Error("Review not found."), { status: 404 });
  }

  if (String(review.customer) !== userId) {
    throw Object.assign(new Error("Access denied. You can only delete your own reviews."), { status: 403 });
  }

  const campgroundId = String(review.campground);
  await review.deleteOne();
  await recalculateCampgroundRating(campgroundId);
}
