import mongoose from "mongoose";
import User, { UserRole } from "../models/User";
import { hashPassword } from "../utils/password";
import { sanitiseUser } from "../services/authService";

export interface AdministratorCreateInput {
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

export type AdministratorUpdateInput = Partial<AdministratorCreateInput> & {
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export interface AdministratorQueryOptions {
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

function buildFilters(options: AdministratorQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    role: "admin",
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

function buildSort(options: AdministratorQueryOptions): Record<string, number> {
  const field = options.sort === "firstName"
    ? "firstName"
    : options.sort === "lastName"
      ? "lastName"
      : options.sort === "email"
        ? "email"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

export async function listAdministrators(
  options: AdministratorQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<ReturnType<typeof sanitiseUser>>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can view administrators."), { status: 403 });
  }

  const filters = buildFilters(options);
  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    User.find(filters)
      .sort(sort as any)
      .skip(skip)
      .limit(options.limit)
      .exec(),
    User.countDocuments(filters),
  ]);

  return {
    data: data.map((admin) => sanitiseUser(admin)),
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getAdministratorById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid administrator ID."), { status: 400 });
  }

  const administrator = await User.findOne({ _id: id, role: "admin" }).exec();
  if (!administrator) {
    throw Object.assign(new Error("Administrator not found."), { status: 404 });
  }

  if (userRole !== "admin" && String(administrator._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own administrator record."), { status: 403 });
  }

  return sanitiseUser(administrator);
}

export async function createAdministrator(
  input: AdministratorCreateInput,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can create administrators."), { status: 403 });
  }

  const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
  if (existing) {
    throw Object.assign(new Error("An administrator with that email already exists."), { status: 409 });
  }

  const hashedPassword = await hashPassword(input.password);

  const administrator = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    password: hashedPassword,
    phone: input.phone,
    avatar: input.avatar,
    bio: input.bio,
    address: input.address,
    role: "admin",
    isActive: true,
    isEmailVerified: false,
  });

  return sanitiseUser(administrator);
}

export async function updateAdministrator(
  id: string,
  input: AdministratorUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid administrator ID."), { status: 400 });
  }

  const administrator = await User.findOne({ _id: id, role: "admin" }).exec();
  if (!administrator) {
    throw Object.assign(new Error("Administrator not found."), { status: 404 });
  }

  const isOwner = String(administrator._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only update your own administrator record."), { status: 403 });
  }

  if (userRole !== "admin") {
    if (input.isActive !== undefined || input.isEmailVerified !== undefined) {
      throw Object.assign(new Error("Access denied. Only admins can update account status fields."), { status: 403 });
    }
  }

  if (input.email && input.email.toLowerCase().trim() !== administrator.email) {
    const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
    if (existing && String(existing._id) !== String(administrator._id)) {
      throw Object.assign(new Error("An administrator with that email already exists."), { status: 409 });
    }
    administrator.email = input.email.toLowerCase().trim();
  }

  if (input.firstName !== undefined) {
    administrator.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    administrator.lastName = input.lastName.trim();
  }

  if (input.password !== undefined) {
    administrator.password = await hashPassword(input.password);
  }

  if (input.phone !== undefined) {
    administrator.phone = input.phone;
  }

  if (input.avatar !== undefined) {
    administrator.avatar = input.avatar;
  }

  if (input.bio !== undefined) {
    administrator.bio = input.bio;
  }

  if (input.address !== undefined) {
    administrator.address = input.address;
  }

  if (input.isActive !== undefined) {
    administrator.isActive = input.isActive;
  }

  if (input.isEmailVerified !== undefined) {
    administrator.isEmailVerified = input.isEmailVerified;
  }

  await administrator.save();
  return sanitiseUser(administrator);
}

export async function deleteAdministrator(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid administrator ID."), { status: 400 });
  }

  const administrator = await User.findOne({ _id: id, role: "admin" }).exec();
  if (!administrator) {
    throw Object.assign(new Error("Administrator not found."), { status: 404 });
  }

  const isOwner = String(administrator._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only delete your own administrator account."), { status: 403 });
  }

  await User.findByIdAndDelete(id).exec();
}
