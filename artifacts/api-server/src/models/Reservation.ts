import mongoose, { Document, Schema, Model } from "mongoose";

interface ICounter extends Document<string> {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

const Counter: Model<ICounter> = (mongoose.models.Counter as Model<ICounter>) || mongoose.model<ICounter>(
  "Counter",
  counterSchema,
);

// ─── Main document interface ──────────────────────────────────────────────────
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface IGuestInfo {
  adults: number;
  children: number;
  vehicles: number;
}

export interface IPricingBreakdown {
  baseRate: number;        // per-night rate applied
  nights: number;
  subtotal: number;
  taxes: number;           // flat tax amount
  fees: number;            // cleaning fee, booking fee, etc.
  discount: number;        // promotional discount amount
  total: number;
}

export interface IReservation extends Document {
  reservationNumber: string; // human-readable unique ID e.g. "CF-20240101-0001"
  customer: mongoose.Types.ObjectId;
  campsite: mongoose.Types.ObjectId;
  campground: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: IGuestInfo;
  status: ReservationStatus;
  pricing: IPricingBreakdown;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  nights: number; // virtual
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const reservationSchema = new Schema<IReservation>(
  {
    reservationNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    campsite: {
      type: Schema.Types.ObjectId,
      ref: "Campsite",
      required: [true, "Campsite is required"],
    },
    campground: {
      type: Schema.Types.ObjectId,
      ref: "Campground",
      required: [true, "Campground is required"],
    },
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: [1, "At least 1 adult is required"],
        default: 1,
      },
      children: { type: Number, default: 0, min: 0 },
      vehicles: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending",
    },
    pricing: {
      baseRate: { type: Number, required: true, min: 0 },
      nights: { type: Number, required: true, min: 1 },
      subtotal: { type: Number, required: true, min: 0 },
      taxes: { type: Number, default: 0, min: 0 },
      fees: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"],
    },
    cancellationReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Validation: checkOut must be after checkIn ───────────────────────────────
reservationSchema.pre("validate", function (next) {
  if (this.checkIn && this.checkOut && this.checkOut <= this.checkIn) {
    this.invalidate("checkOut", "Check-out date must be after check-in date");
  }
  next();
});

// ─── Auto-generate reservation number ────────────────────────────────────────
reservationSchema.pre("save", async function (next) {
  if (this.isNew && !this.reservationNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const counterId = `reservation_${dateStr}`;
    const counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    if (!counter) {
      next(new Error("Unable to generate reservation number."));
      return;
    }

    this.reservationNumber = `CF-${dateStr}-${String(counter.seq).padStart(4, "0")}`;
  }
  next();
});

// ─── Virtual: number of nights ────────────────────────────────────────────────
reservationSchema.virtual("nights").get(function (this: IReservation) {
  if (!this.checkIn || !this.checkOut) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((this.checkOut.getTime() - this.checkIn.getTime()) / msPerDay);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
reservationSchema.index({ reservationNumber: 1 }, { unique: true });
reservationSchema.index({ customer: 1, status: 1 });
reservationSchema.index({ campsite: 1, checkIn: 1, checkOut: 1 });
reservationSchema.index({ campground: 1, status: 1 });
reservationSchema.index({ checkIn: 1, checkOut: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Reservation: Model<IReservation> = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema,
);
export default Reservation;
