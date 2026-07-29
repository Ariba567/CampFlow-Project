import mongoose from "mongoose";
import Notification, { INotification, NotificationType } from "../models/Notification";
import { UserRole } from "../models/User";

export interface NotificationCreateInput {
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead?: boolean;
  readAt?: Date;
  sentAt?: Date;
  channels?: Array<"in_app" | "email" | "sms">;
  emailSent?: boolean;
  smsSent?: boolean;
  relatedReservation?: string;
  relatedPayment?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export type NotificationUpdateInput = Partial<NotificationCreateInput>;

export interface NotificationQueryOptions {
  page: number;
  limit: number;
  sort?: "createdAt" | "sentAt" | "type" | "isRead";
  order: "asc" | "desc";
  search?: string;
  recipient?: string;
  type?: NotificationType;
  isRead?: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  relatedReservation?: string;
  relatedPayment?: string;
  sentFrom?: Date;
  sentTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: NotificationQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (options.recipient && mongoose.isValidObjectId(options.recipient)) {
    filters.recipient = new mongoose.Types.ObjectId(options.recipient);
  }

  if (options.type) {
    filters.type = options.type;
  }

  if (typeof options.isRead === "boolean") {
    filters.isRead = options.isRead;
  }

  if (typeof options.emailSent === "boolean") {
    filters.emailSent = options.emailSent;
  }

  if (typeof options.smsSent === "boolean") {
    filters.smsSent = options.smsSent;
  }

  if (options.relatedReservation && mongoose.isValidObjectId(options.relatedReservation)) {
    filters.relatedReservation = new mongoose.Types.ObjectId(options.relatedReservation);
  }

  if (options.relatedPayment && mongoose.isValidObjectId(options.relatedPayment)) {
    filters.relatedPayment = new mongoose.Types.ObjectId(options.relatedPayment);
  }

  if (options.sentFrom) {
    filters.sentAt = { ...(filters.sentAt as Record<string, unknown>), $gte: options.sentFrom };
  }

  if (options.sentTo) {
    filters.sentAt = { ...(filters.sentAt as Record<string, unknown>), $lte: options.sentTo };
  }

  if (options.createdFrom) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $gte: options.createdFrom };
  }

  if (options.createdTo) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $lte: options.createdTo };
  }

  if (options.search?.trim()) {
    const query = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(query, "i");
    filters.$or = [
      { title: regex },
      { message: regex },
    ];
  }

  return filters;
}

function buildSort(options: NotificationQueryOptions): Record<string, number> {
  const field = options.sort === "sentAt"
    ? "sentAt"
    : options.sort === "type"
      ? "type"
      : options.sort === "isRead"
        ? "isRead"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

export async function listNotifications(
  options: NotificationQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<INotification>> {
  const filters = buildFilters(options);

  if (userRole !== "admin") {
    if (options.recipient && options.recipient !== userId) {
      throw Object.assign(new Error("Access denied. You can only view your own notifications."), { status: 403 });
    }

    filters.recipient = new mongoose.Types.ObjectId(userId);
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Notification.find(filters)
      .sort(sort as mongoose.SortOrder)
      .skip(skip)
      .limit(options.limit)
      .populate("recipient", "firstName lastName email")
      .populate("relatedReservation", "reservationNumber")
      .populate("relatedPayment", "transactionId status")
      .exec(),
    Notification.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getNotificationById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<INotification> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid notification ID."), { status: 400 });
  }

  const notification = await Notification.findById(id)
    .populate("recipient", "firstName lastName email")
    .populate("relatedReservation", "reservationNumber")
    .populate("relatedPayment", "transactionId status")
    .exec();

  if (!notification) {
    throw Object.assign(new Error("Notification not found."), { status: 404 });
  }

  if (userRole !== "admin" && String(notification.recipient) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own notifications."), { status: 403 });
  }

  return notification;
}

export async function createNotification(
  input: NotificationCreateInput,
  userRole: UserRole,
): Promise<INotification> {
  if (userRole !== "admin" && userRole !== "manager") {
    throw Object.assign(new Error("Access denied. Only managers or admins can create notifications."), { status: 403 });
  }

  const notification = await Notification.create({
    recipient: new mongoose.Types.ObjectId(input.recipient),
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: input.isRead,
    readAt: input.readAt,
    sentAt: input.sentAt,
    channels: input.channels,
    emailSent: input.emailSent,
    smsSent: input.smsSent,
    relatedReservation: input.relatedReservation ? new mongoose.Types.ObjectId(input.relatedReservation) : undefined,
    relatedPayment: input.relatedPayment ? new mongoose.Types.ObjectId(input.relatedPayment) : undefined,
    metadata: input.metadata,
    expiresAt: input.expiresAt,
  });

  return notification;
}

export async function updateNotification(
  id: string,
  input: NotificationUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<INotification> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid notification ID."), { status: 400 });
  }

  const notification = await Notification.findById(id).exec();
  if (!notification) {
    throw Object.assign(new Error("Notification not found."), { status: 404 });
  }

  if (userRole !== "admin" && userRole !== "manager" && String(notification.recipient) !== userId) {
    throw Object.assign(new Error("Access denied. You can only update your own notifications."), { status: 403 });
  }

  if (input.recipient) {
    notification.recipient = new mongoose.Types.ObjectId(input.recipient);
  }

  if (input.type !== undefined) {
    notification.type = input.type;
  }

  if (input.title !== undefined) {
    notification.title = input.title;
  }

  if (input.message !== undefined) {
    notification.message = input.message;
  }

  if (input.isRead !== undefined) {
    notification.isRead = input.isRead;
    notification.readAt = input.isRead ? input.readAt ?? new Date() : undefined;
  }

  if (input.readAt !== undefined) {
    notification.readAt = input.readAt;
  }

  if (input.sentAt !== undefined) {
    notification.sentAt = input.sentAt;
  }

  if (input.channels !== undefined) {
    notification.channels = input.channels;
  }

  if (input.emailSent !== undefined) {
    notification.emailSent = input.emailSent;
  }

  if (input.smsSent !== undefined) {
    notification.smsSent = input.smsSent;
  }

  if (input.relatedReservation !== undefined) {
    notification.relatedReservation = input.relatedReservation
      ? new mongoose.Types.ObjectId(input.relatedReservation)
      : undefined;
  }

  if (input.relatedPayment !== undefined) {
    notification.relatedPayment = input.relatedPayment
      ? new mongoose.Types.ObjectId(input.relatedPayment)
      : undefined;
  }

  if (input.metadata !== undefined) {
    notification.metadata = input.metadata;
  }

  if (input.expiresAt !== undefined) {
    notification.expiresAt = input.expiresAt;
  }

  await notification.save();
  return notification;
}

export async function deleteNotification(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid notification ID."), { status: 400 });
  }

  const notification = await Notification.findById(id).exec();
  if (!notification) {
    throw Object.assign(new Error("Notification not found."), { status: 404 });
  }

  if (userRole !== "admin" && userRole !== "manager" && String(notification.recipient) !== userId) {
    throw Object.assign(new Error("Access denied. You can only delete your own notifications."), { status: 403 });
  }

  await Notification.findByIdAndDelete(id).exec();
}
