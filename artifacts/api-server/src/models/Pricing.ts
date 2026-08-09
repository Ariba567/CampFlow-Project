import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Main document interface ──────────────────────────────────────────────────
export type PricingType = "seasonal" | "weekend" | "holiday" | "promotional";
export type PricingApplyMode = "multiplier" | "flat_rate" | "override";
export type SiteTypeEnum = "tent" | "rv" | "cabin" | "glamping" | "group";

export interface IPricing extends Document {
  name: string;
  campground: mongoose.Types.ObjectId;
  campsite?: mongoose.Types.ObjectId;  // null = applies to all sites in campground
  siteType?: SiteTypeEnum;             // which campsite type this rule applies to
  type: PricingType;
  applyMode: PricingApplyMode;
  multiplier?: number;    // e.g. 1.5 for 50% increase
  flatRate?: number;      // USD per night override or surcharge
  startDate: Date;
  endDate: Date;
  daysOfWeek?: number[];  // 0=Sun..6=Sat; empty = all days
  couponCode?: string;    // for promotional type
  maxUses?: number;
  usedCount: number;
  priority: number;       // higher = applied first when multiple rules match
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const pricingSchema = new Schema<IPricing>(
  {
    name: {
      type: String,
      required: [true, "Pricing rule name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    campground: {
      type: Schema.Types.ObjectId,
      ref: "Campground",
      required: [true, "Campground is required"],
    },
    campsite: {
      type: Schema.Types.ObjectId,
      ref: "Campsite",
      default: null,
    },
    siteType: {
      type: String,
      enum: ["tent", "rv", "cabin", "glamping", "group"],
    },
    type: {
      type: String,
      required: [true, "Pricing type is required"],
      enum: ["seasonal", "weekend", "holiday", "promotional"],
    },
    applyMode: {
      type: String,
      required: [true, "Apply mode is required"],
      enum: ["multiplier", "flat_rate", "override"],
      default: "multiplier",
    },
    multiplier: {
      type: Number,
      min: [0.01, "Multiplier must be greater than 0"],
    },
    flatRate: {
      type: Number,
      min: [0, "Flat rate cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: (days: number[]) => days.every((d) => d >= 0 && d <= 6),
        message: "Days of week must be 0 (Sunday) through 6 (Saturday)",
      },
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

// ─── Validation: endDate must be after startDate ──────────────────────────────
pricingSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
  if (this.applyMode === "multiplier" && !this.multiplier) {
    this.invalidate("multiplier", "Multiplier is required for multiplier mode");
  }
  if (this.applyMode !== "multiplier" && !this.flatRate) {
    this.invalidate("flatRate", "Flat rate is required for flat_rate/override mode");
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
pricingSchema.index({ campground: 1, isActive: 1, startDate: 1, endDate: 1 });
pricingSchema.index({ campsite: 1, isActive: 1 });
pricingSchema.index({ type: 1, isActive: 1 });
pricingSchema.index({ couponCode: 1 }, { sparse: true });
pricingSchema.index({ priority: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Pricing: Model<IPricing> = mongoose.model<IPricing>("Pricing", pricingSchema);
export default Pricing;
