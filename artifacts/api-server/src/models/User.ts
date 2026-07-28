import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Role enum ────────────────────────────────────────────────────────────────
export type UserRole = "guest" | "customer" | "manager" | "admin";

// ─── Address sub-document ─────────────────────────────────────────────────────
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// ─── User document interface ──────────────────────────────────────────────────
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: IAddress;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  favorites: mongoose.Types.ObjectId[];  // campsite IDs
  createdAt: Date;
  updatedAt: Date;
  fullName: string; // virtual
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true, default: "US" },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["guest", "customer", "manager", "admin"],
      default: "customer",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number"],
    },
    avatar: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: [500, "Bio cannot exceed 500 characters"] },
    address: addressSchema,
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Campsite" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email uniqueness is already enforced by `unique: true` in the field definition;
// only add the non-unique supplemental indexes here to avoid the duplicate-index warning.
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
