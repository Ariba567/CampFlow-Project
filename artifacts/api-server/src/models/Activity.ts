import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Sub-document interface ───────────────────────────────────────────────────
export interface IActivitySchedule {
  day: string;       // e.g. "Monday", "Daily", "Weekends"
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "12:00"
  maxParticipants?: number;
}

// ─── Main document interface ──────────────────────────────────────────────────
export interface IActivity extends Document {
  campground: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: string;         // e.g. "hiking", "kayaking", "fishing", "campfire"
  difficulty: "easy" | "moderate" | "hard" | "expert";
  durationMinutes: number;
  price: number;        // 0 = included with booking
  isIncluded: boolean;  // included in base reservation price
  images: string[];
  schedule: IActivitySchedule[];
  minParticipants: number;
  maxParticipants?: number;
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  requirements: string[]; // e.g. "must know how to swim"
  equipment: string[];    // equipment provided
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const activitySchema = new Schema<IActivity>(
  {
    campground: {
      type: Schema.Types.ObjectId,
      ref: "Campground",
      required: [true, "Campground is required"],
    },
    name: {
      type: String,
      required: [true, "Activity name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      required: [true, "Activity type is required"],
      trim: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard", "expert"],
      default: "easy",
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    isIncluded: { type: Boolean, default: false },
    images: [{ type: String }],
    schedule: [
      {
        day: { type: String, required: true, trim: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        maxParticipants: { type: Number, min: 1 },
        _id: false,
      },
    ],
    minParticipants: { type: Number, default: 1, min: 1 },
    maxParticipants: { type: Number, min: 1 },
    ageRestriction: {
      min: { type: Number, min: 0 },
      max: { type: Number },
    },
    requirements: [{ type: String, trim: true }],
    equipment: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
activitySchema.index({ campground: 1, isActive: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ difficulty: 1 });
activitySchema.index({ isIncluded: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Activity: Model<IActivity> = mongoose.model<IActivity>("Activity", activitySchema);
export default Activity;
