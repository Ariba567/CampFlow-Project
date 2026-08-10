import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Main document interface ──────────────────────────────────────────────────
export interface IReview extends Document {
  customer: mongoose.Types.ObjectId;
  campground: mongoose.Types.ObjectId;
  reservationId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
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
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: [true, "Reservation is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Review must be at least 10 characters"],
      maxlength: [500, "Review cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

// ─── One review per customer per campground ────────────────────────────────────
reviewSchema.index({ customer: 1, campground: 1 }, { unique: true });
reviewSchema.index({ campground: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Review: Model<IReview> = mongoose.model<IReview>("Review", reviewSchema);
export default Review;
