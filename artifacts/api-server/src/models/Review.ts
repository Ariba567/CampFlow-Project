import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Sub-document interface ───────────────────────────────────────────────────
export interface IRatingBreakdown {
  cleanliness: number;
  facilities: number;
  location: number;
  value: number;
  staff: number;
}

// ─── Main document interface ──────────────────────────────────────────────────
export interface IReview extends Document {
  customer: mongoose.Types.ObjectId;
  campground: mongoose.Types.ObjectId;
  campsite?: mongoose.Types.ObjectId;
  reservation: mongoose.Types.ObjectId;
  overallRating: number;       // 1–5
  ratingBreakdown: IRatingBreakdown;
  title: string;
  body: string;
  images: string[];
  ownerResponse?: string;
  ownerResponseAt?: Date;
  isApproved: boolean;
  isHidden: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const reviewSchema = new Schema<IReview>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    campground: {
      type: Schema.Types.ObjectId,
      ref: "Campground",
      required: [true, "Campground is required"],
    },
    campsite: {
      type: Schema.Types.ObjectId,
      ref: "Campsite",
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: [true, "Reservation is required"],
    },
    overallRating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    ratingBreakdown: {
      cleanliness: { type: Number, min: 1, max: 5, default: 3 },
      facilities: { type: Number, min: 1, max: 5, default: 3 },
      location: { type: Number, min: 1, max: 5, default: 3 },
      value: { type: Number, min: 1, max: 5, default: 3 },
      staff: { type: Number, min: 1, max: 5, default: 3 },
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    body: {
      type: String,
      required: [true, "Review body is required"],
      trim: true,
      minlength: [20, "Review must be at least 20 characters"],
      maxlength: [3000, "Review cannot exceed 3000 characters"],
    },
    images: [{ type: String }],
    ownerResponse: {
      type: String,
      trim: true,
      maxlength: [1000, "Response cannot exceed 1000 characters"],
    },
    ownerResponseAt: { type: Date },
    isApproved: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ─── One review per customer per reservation ──────────────────────────────────
reviewSchema.index({ customer: 1, reservation: 1 }, { unique: true });
reviewSchema.index({ campground: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ campsite: 1, isApproved: 1 });
reviewSchema.index({ overallRating: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Review: Model<IReview> = mongoose.model<IReview>("Review", reviewSchema);
export default Review;
