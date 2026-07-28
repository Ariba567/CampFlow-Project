import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Sub-document interfaces ──────────────────────────────────────────────────
export interface ISiteCapacity {
  maxGuests: number;
  maxTents?: number;
  maxRvLength?: number; // feet
}

export interface IMapCoordinates {
  x: number; // percentage position on campground map
  y: number;
}

// ─── Main document interface ──────────────────────────────────────────────────
export interface ICampsite extends Document {
  campground: mongoose.Types.ObjectId;
  name: string;
  siteNumber: string;
  type: "tent" | "rv" | "cabin" | "glamping" | "group";
  description: string;
  images: string[];
  capacity: ISiteCapacity;
  amenities: string[];
  basePrice: number;       // per night in USD
  weekendPrice?: number;   // override for weekends
  isActive: boolean;
  isAvailable: boolean;    // manual override by manager
  mapCoordinates?: IMapCoordinates;
  features: string[];      // e.g. "waterfront", "shaded", "electric hookup"
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const campsiteSchema = new Schema<ICampsite>(
  {
    campground: {
      type: Schema.Types.ObjectId,
      ref: "Campground",
      required: [true, "Campground reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Campsite name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    siteNumber: {
      type: String,
      required: [true, "Site number is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Site type is required"],
      enum: {
        values: ["tent", "rv", "cabin", "glamping", "group"],
        message: "Type must be one of: tent, rv, cabin, glamping, group",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    images: [{ type: String }],
    capacity: {
      maxGuests: {
        type: Number,
        required: [true, "Max guests is required"],
        min: [1, "Must accommodate at least 1 guest"],
      },
      maxTents: { type: Number, min: 0 },
      maxRvLength: { type: Number, min: 0 },
    },
    amenities: [{ type: String, trim: true }],
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    weekendPrice: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    mapCoordinates: {
      x: { type: Number, min: 0, max: 100 },
      y: { type: Number, min: 0, max: 100 },
    },
    features: [{ type: String, trim: true }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// ─── Compound unique index: site number must be unique within a campground ────
campsiteSchema.index({ campground: 1, siteNumber: 1 }, { unique: true });
campsiteSchema.index({ campground: 1, type: 1 });
campsiteSchema.index({ campground: 1, isActive: 1, isAvailable: 1 });
campsiteSchema.index({ basePrice: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Campsite: Model<ICampsite> = mongoose.model<ICampsite>("Campsite", campsiteSchema);
export default Campsite;
