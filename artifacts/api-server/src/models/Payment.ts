import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Main document interface ──────────────────────────────────────────────────
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "partial_refund";
export type PaymentMethod = "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "other";

export interface IRefund {
  amount: number;
  reason: string;
  refundedAt: Date;
  transactionId?: string;
}

export interface IPayment extends Document {
  reservation: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;            // in USD
  currency: string;          // e.g. "USD"
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;    // from payment gateway
  gatewayResponse?: Record<string, unknown>;
  refunds: IRefund[];
  totalRefunded: number;
  notes?: string;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const paymentSchema = new Schema<IPayment>(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: [true, "Reservation is required"],
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "partial_refund"],
      default: "pending",
    },
    method: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "other"],
      required: [true, "Payment method is required"],
    },
    transactionId: { type: String, trim: true },
    gatewayResponse: { type: Schema.Types.Mixed },
    refunds: [
      {
        amount: { type: Number, required: true, min: 0 },
        reason: { type: String, required: true, trim: true },
        refundedAt: { type: Date, required: true, default: Date.now },
        transactionId: { type: String, trim: true },
      },
    ],
    totalRefunded: { type: Number, default: 0, min: 0 },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    paidAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String, trim: true },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ customer: 1, status: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ status: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Payment: Model<IPayment> = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
