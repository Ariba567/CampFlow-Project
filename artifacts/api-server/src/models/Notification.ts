import mongoose, { Document, Schema, Model } from "mongoose";

// ─── Main document interface ──────────────────────────────────────────────────
export type NotificationType =
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_reminder"
  | "payment_confirmation"
  | "payment_failed"
  | "review_request"
  | "system_message"
  | "promotion";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  sentAt?: Date;
  channels: Array<"in_app" | "email" | "sms">;
  emailSent: boolean;
  smsSent: boolean;
  relatedReservation?: mongoose.Types.ObjectId;
  relatedPayment?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "booking_confirmation",
        "booking_cancellation",
        "booking_reminder",
        "payment_confirmation",
        "payment_failed",
        "review_request",
        "system_message",
        "promotion",
      ],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    sentAt: { type: Date, default: Date.now },
    channels: {
      type: [String],
      enum: ["in_app", "email", "sms"],
      default: ["in_app"],
    },
    emailSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    relatedReservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
    },
    relatedPayment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    metadata: { type: Schema.Types.Mixed },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// ─── TTL index: auto-delete expired notifications ────────────────────────────
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// ─── Query indexes ────────────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
export default Notification;
