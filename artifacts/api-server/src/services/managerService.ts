import mongoose from "mongoose";
import User, { UserRole } from "../models/User";
import { hashPassword } from "../utils/password";
import { sanitiseUser } from "../services/authService";

export interface ManagerCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export type ManagerUpdateInput = Partial<ManagerCreateInput> & {
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export interface ManagerQueryOptions {
  page: number;
  limit: number;
  sort?: "createdAt" | "firstName" | "lastName" | "email";
  order: "asc" | "desc";
  search?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
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

function buildFilters(options: ManagerQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    role: "manager",
  };

  if (options.email) {
    filters.email = new RegExp(`^${options.email.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`, "i");
  }

  if (options.phone) {
    filters.phone = new RegExp(`^${options.phone.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`, "i");
  }

  if (typeof options.isActive === "boolean") {
    filters.isActive = options.isActive;
  }

  if (options.createdFrom) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $gte: options.createdFrom };
  }

  if (options.createdTo) {
    filters.createdAt = { ...(filters.createdAt as Record<string, unknown>), $lte: options.createdTo };
  }

  if (options.search?.trim()) {
    const query = options.search.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const regex = new RegExp(query, "i");
    filters.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { bio: regex },
    ];
  }

  return filters;
}

function buildSort(options: ManagerQueryOptions): Record<string, number> {
  const field = options.sort === "firstName"
    ? "firstName"
    : options.sort === "lastName"
      ? "lastName"
      : options.sort === "email"
        ? "email"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

export async function listManagers(
  options: ManagerQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<ReturnType<typeof sanitiseUser>>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can view managers."), { status: 403 });
  }

  const filters = buildFilters(options);
  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    User.find(filters)
      .sort(sort as mongoose.SortOrder)
      .skip(skip)
      .limit(options.limit)
      .exec(),
    User.countDocuments(filters),
  ]);

  return {
    data: data.map((manager) => sanitiseUser(manager)),
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getManagerById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid manager ID."), { status: 400 });
  }

  const manager = await User.findOne({ _id: id, role: "manager" }).exec();
  if (!manager) {
    throw Object.assign(new Error("Manager not found."), { status: 404 });
  }

  if (userRole !== "admin" && String(manager._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own manager record."), { status: 403 });
  }

  return sanitiseUser(manager);
}

export async function createManager(
  input: ManagerCreateInput,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can create managers."), { status: 403 });
  }

  const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
  if (existing) {
    throw Object.assign(new Error("A manager with that email already exists."), { status: 409 });
  }

  const hashedPassword = await hashPassword(input.password);

  const manager = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    password: hashedPassword,
    phone: input.phone,
    avatar: input.avatar,
    bio: input.bio,
    address: input.address,
    role: "manager",
    isActive: true,
    isEmailVerified: false,
  });

  return sanitiseUser(manager);
}

export async function updateManager(
  id: string,
  input: ManagerUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid manager ID."), { status: 400 });
  }

  const manager = await User.findOne({ _id: id, role: "manager" }).exec();
  if (!manager) {
    throw Object.assign(new Error("Manager not found."), { status: 404 });
  }

  const isOwner = String(manager._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only update your own manager record."), { status: 403 });
  }

  if (userRole !== "admin") {
    if (input.isActive !== undefined || input.isEmailVerified !== undefined) {
      throw Object.assign(new Error("Access denied. Only admins can update account status fields."), { status: 403 });
    }
  }

  if (input.email && input.email.toLowerCase().trim() !== manager.email) {
    const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
    if (existing && String(existing._id) !== String(manager._id)) {
      throw Object.assign(new Error("A manager with that email already exists."), { status: 409 });
    }
    manager.email = input.email.toLowerCase().trim();
  }

  if (input.firstName !== undefined) {
    manager.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    manager.lastName = input.lastName.trim();
  }

  if (input.password !== undefined) {
    manager.password = await hashPassword(input.password);
  }

  if (input.phone !== undefined) {
    manager.phone = input.phone;
  }

  if (input.avatar !== undefined) {
    manager.avatar = input.avatar;
  }

  if (input.bio !== undefined) {
    manager.bio = input.bio;
  }

  if (input.address !== undefined) {
    manager.address = input.address;
  }

  if (input.isActive !== undefined) {
    manager.isActive = input.isActive;
  }

  if (input.isEmailVerified !== undefined) {
    manager.isEmailVerified = input.isEmailVerified;
  }

  await manager.save();
  return sanitiseUser(manager);
}

export async function deleteManager(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid manager ID."), { status: 400 });
  }

  const manager = await User.findOne({ _id: id, role: "manager" }).exec();
  if (!manager) {
    throw Object.assign(new Error("Manager not found."), { status: 404 });
  }

  const isOwner = String(manager._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only delete your own manager account."), { status: 403 });
  }

  await User.findByIdAndDelete(id).exec();
}
