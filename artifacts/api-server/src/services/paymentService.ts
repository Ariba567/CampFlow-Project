import mongoose from "mongoose";
import Payment, { IPayment, PaymentMethod, PaymentStatus } from "../models/Payment";
import Reservation from "../models/Reservation";
import Campground from "../models/Campground";
import { UserRole } from "../models/User";

export interface RefundInput {
  amount: number;
  reason: string;
  refundedAt?: Date;
  transactionId?: string;
}

export interface PaymentCreateInput {
  reservation: string;
  customer?: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  refunds?: RefundInput[];
  notes?: string;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export type PaymentUpdateInput = Partial<PaymentCreateInput>;

export interface PaymentQueryOptions {
  page: number;
  limit: number;
  sort?: "createdAt" | "amount" | "status" | "method";
  order: "asc" | "desc";
  search?: string;
  reservation?: string;
  customer?: string;
  status?: PaymentStatus[];
  method?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: PaymentQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (options.reservation && mongoose.isValidObjectId(options.reservation)) {
    filters.reservation = new mongoose.Types.ObjectId(options.reservation);
  }

  if (options.customer && mongoose.isValidObjectId(options.customer)) {
    filters.customer = new mongoose.Types.ObjectId(options.customer);
  }

  if (options.status?.length) {
    filters.status = { $in: options.status };
  }

  if (options.method) {
    filters.method = options.method;
  }

  if (typeof options.minAmount === "number") {
    filters.amount = { ...(filters.amount as Record<string, unknown>), $gte: options.minAmount };
  }

  if (typeof options.maxAmount === "number") {
    filters.amount = { ...(filters.amount as Record<string, unknown>), $lte: options.maxAmount };
  }

  if (options.fromDate) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $gte: options.fromDate };
  }

  if (options.toDate) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $lte: options.toDate };
  }

  if (options.search?.trim()) {
    const term = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(term, "i");
    filters.$or = [
      { transactionId: regex },
      { notes: regex },
      { failureReason: regex },
    ];
  }

  return filters;
}

function buildSort(options: PaymentQueryOptions): Record<string, number> {
  const field = options.sort === "amount"
    ? "amount"
    : options.sort === "status"
      ? "status"
      : options.sort === "method"
        ? "method"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

async function getManagerCampgroundIds(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id");
  return campgrounds.map((campground) => campground._id);
}

async function getManagerReservationIds(userId: string, campgroundId?: string) {
  const ownedCampgrounds = await getManagerCampgroundIds(userId);

  if (campgroundId && !ownedCampgrounds.some((id) => id.equals(campgroundId))) {
    throw Object.assign(new Error("Access denied. You can only view payments for your own campgrounds."), {
      status: 403,
    });
  }

  if (ownedCampgrounds.length === 0) {
    return [] as mongoose.Types.ObjectId[];
  }

  const query: Record<string, unknown> = {
    campground: { $in: ownedCampgrounds },
  };

  if (campgroundId) {
    query.campground = new mongoose.Types.ObjectId(campgroundId);
  }

  const reservations = await Reservation.find(query).select("_id").exec();
  return reservations.map((reservation) => reservation._id);
}

function buildRefunds(refunds: RefundInput[] = []) {
  return refunds.map((refund) => ({
    amount: refund.amount,
    reason: refund.reason,
    refundedAt: refund.refundedAt ?? new Date(),
    transactionId: refund.transactionId,
  }));
}

function sumRefunds(refunds: RefundInput[] = []) {
  return refunds.reduce((total, refund) => total + refund.amount, 0);
}

async function getReservationWithCampground(reservationId: string) {
  if (!mongoose.isValidObjectId(reservationId)) {
    throw Object.assign(new Error("Invalid reservation ID."), { status: 400 });
  }

  const reservation = await Reservation.findById(reservationId)
    .select("customer campground")
    .populate("campground", "manager")
    .exec();

  if (!reservation) {
    throw Object.assign(new Error("Reservation not found."), { status: 404 });
  }

  return reservation;
}

export async function listPayments(
  options: PaymentQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<IPayment>> {
  const filters = buildFilters(options);

  if (userRole === "customer") {
    filters.customer = new mongoose.Types.ObjectId(userId);
  }

  if (userRole === "manager") {
    const reservationIds = await getManagerReservationIds(userId);

    if (reservationIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 1,
      };
    }

    filters.reservation = { $in: reservationIds };
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Payment.find(filters)
      .sort(sort as mongoose.SortOrder)
      .skip(skip)
      .limit(options.limit)
      .populate("customer", "firstName lastName email")
      .populate("reservation", "reservationNumber")
      .exec(),
    Payment.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getPaymentById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<IPayment> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid payment ID."), { status: 400 });
  }

  const payment = await Payment.findById(id)
    .populate("customer", "firstName lastName email")
    .populate({
      path: "reservation",
      populate: { path: "campground", select: "manager" },
    })
    .exec();

  if (!payment) {
    throw Object.assign(new Error("Payment not found."), { status: 404 });
  }

  if (userRole === "customer" && String(payment.customer) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own payments."), { status: 403 });
  }

  if (userRole === "manager") {
    const reservation = payment.reservation as { campground?: { manager: mongoose.Types.ObjectId } };
    const campground = reservation?.campground as { manager: mongoose.Types.ObjectId } | undefined;

    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only view payments for your own campgrounds."), {
        status: 403,
      });
    }
  }

  return payment;
}

export async function createPayment(
  input: PaymentCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IPayment> {
  const reservation = await getReservationWithCampground(input.reservation);

  if (userRole === "customer") {
    if (String(reservation.customer) !== userId) {
      throw Object.assign(new Error("Access denied. You can only create payments for your own reservations."), {
        status: 403,
      });
    }
  }

  if (userRole === "manager") {
    const campground = reservation.campground as { manager: mongoose.Types.ObjectId } | undefined;
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only create payments for your own campgrounds."), {
        status: 403,
      });
    }
  }

  const customerId = userRole === "customer"
    ? userId
    : input.customer ?? String(reservation.customer);

  if (!mongoose.isValidObjectId(customerId)) {
    throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
  }

  const refunds = buildRefunds(input.refunds);
  const totalRefunded = sumRefunds(input.refunds ?? []);

  return Payment.create({
    reservation: new mongoose.Types.ObjectId(input.reservation),
    customer: new mongoose.Types.ObjectId(customerId),
    amount: input.amount,
    currency: input.currency ? input.currency.trim().toUpperCase() : undefined,
    status: input.status,
    method: input.method,
    transactionId: input.transactionId,
    gatewayResponse: input.gatewayResponse,
    refunds,
    totalRefunded,
    notes: input.notes,
    paidAt: input.paidAt,
    failedAt: input.failedAt,
    failureReason: input.failureReason,
  });
}

export async function updatePayment(
  id: string,
  input: PaymentUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IPayment> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid payment ID."), { status: 400 });
  }

  const payment = await Payment.findById(id)
    .populate({
      path: "reservation",
      populate: { path: "campground", select: "manager" },
    })
    .exec();

  if (!payment) {
    throw Object.assign(new Error("Payment not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const currentReservation = payment.reservation as { campground?: { manager: mongoose.Types.ObjectId } };
    const campground = currentReservation?.campground as { manager: mongoose.Types.ObjectId } | undefined;

    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update payments for your own campgrounds."), {
        status: 403,
      });
    }
  }

  if (input.reservation) {
    const reservation = await getReservationWithCampground(input.reservation);
    if (userRole === "manager") {
      const campground = reservation.campground as { manager: mongoose.Types.ObjectId } | undefined;
      if (!campground || String(campground.manager) !== userId) {
        throw Object.assign(new Error("Access denied. You can only assign payments to reservations on your own campgrounds."), {
          status: 403,
        });
      }
    }
  }

  const updateFields: Record<string, unknown> = {};

  if (input.reservation) {
    updateFields.reservation = new mongoose.Types.ObjectId(input.reservation);
  }

  if (input.customer) {
    if (!mongoose.isValidObjectId(input.customer)) {
      throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
    }
    updateFields.customer = new mongoose.Types.ObjectId(input.customer);
  }

  if (typeof input.amount === "number") {
    updateFields.amount = input.amount;
  }

  if (input.currency !== undefined) {
    updateFields.currency = input.currency.trim().toUpperCase();
  }

  if (input.status !== undefined) {
    updateFields.status = input.status;
    if (input.status === "completed" && !payment.paidAt) {
      updateFields.paidAt = input.paidAt ?? new Date();
    }
    if (input.status === "failed" && !payment.failedAt) {
      updateFields.failedAt = input.failedAt ?? new Date();
    }
  }

  if (input.method !== undefined) {
    updateFields.method = input.method;
  }

  if (input.transactionId !== undefined) {
    updateFields.transactionId = input.transactionId;
  }

  if (input.gatewayResponse !== undefined) {
    updateFields.gatewayResponse = input.gatewayResponse;
  }

  if (input.refunds !== undefined) {
    const refunds = buildRefunds(input.refunds);
    updateFields.refunds = refunds;
    updateFields.totalRefunded = sumRefunds(input.refunds);
  }

  if (input.notes !== undefined) {
    updateFields.notes = input.notes;
  }

  if (input.paidAt !== undefined) {
    updateFields.paidAt = input.paidAt;
  }

  if (input.failedAt !== undefined) {
    updateFields.failedAt = input.failedAt;
  }

  if (input.failureReason !== undefined) {
    updateFields.failureReason = input.failureReason;
  }

  Object.assign(payment, updateFields);
  await payment.save();

  return payment;
}

export async function deletePayment(id: string): Promise<void> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid payment ID."), { status: 400 });
  }

  const payment = await Payment.findByIdAndDelete(id).exec();
  if (!payment) {
    throw Object.assign(new Error("Payment not found."), { status: 404 });
  }
}
