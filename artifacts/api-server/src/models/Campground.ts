import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Sub-document interfaces ──────────────────────────────────────────────────
export interface IGeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ICampgroundAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IOperatingHours {
  checkIn: string;   // e.g. "14:00"
  checkOut: string;  // e.g. "11:00"
  open: string;      // e.g. "08:00"
  close: string;     // e.g. "22:00"
}

// ─── Main document interface ──────────────────────────────────────────────────
export interface ICampground extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  location: IGeoLocation;
  address: ICampgroundAddress;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  coverImage?: string;
  amenities: string[];
  categories: string[];       // tent, rv, cabin, glamping
  tags: string[];
  manager: mongoose.Types.ObjectId;
  rating: {
    average: number;
    count: number;
  };
  operatingHours: IOperatingHours;
  rules: string[];
  petPolicy: string;
  isActive: boolean;
  isFeatured: boolean;
  totalSites: number;         // denormalised count
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const geoLocationSchema = new Schema<IGeoLocation>(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
);

const campgroundSchema = new Schema<ICampground>(
  {
    name: {
      type: String,
      required: [true, "Campground name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    location: {
      type: geoLocationSchema,
      required: true,
      index: "2dsphere",
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zip: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: "US" },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    website: { type: String, trim: true },
    images: [{ type: String }],
    coverImage: { type: String },
    amenities: [{ type: String, trim: true }],
    categories: [
      {
        type: String,
        enum: ["tent", "rv", "cabin", "glamping", "group"],
        trim: true,
      },
    ],
    tags: [{ type: String, trim: true }],
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Manager is required"],
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    operatingHours: {
      checkIn: { type: String, default: "14:00" },
      checkOut: { type: String, default: "11:00" },
      open: { type: String, default: "08:00" },
      close: { type: String, default: "22:00" },
    },
    rules: [{ type: String, trim: true }],
    petPolicy: {
      type: String,
      enum: ["allowed", "not_allowed", "restricted"],
      default: "restricted",
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    totalSites: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Auto-generate slug from name ─────────────────────────────────────────────
campgroundSchema.pre("validate", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = (this.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
campgroundSchema.index({ location: "2dsphere" });
campgroundSchema.index({ slug: 1 }, { unique: true });
campgroundSchema.index({ manager: 1 });
campgroundSchema.index({ isActive: 1, isFeatured: -1 });
campgroundSchema.index({ "rating.average": -1 });
campgroundSchema.index({ name: "text", description: "text", tags: "text" });

// ─── Model ────────────────────────────────────────────────────────────────────
const Campground: Model<ICampground> = mongoose.model<ICampground>(
  "Campground",
  campgroundSchema,
);
export default Campground;
