import mongoose from "mongoose";
import User, { IUser, UserRole } from "../models/User";
import { hashPassword } from "../utils/password";
import { sanitiseUser } from "../services/authService";

export interface CustomerCreateInput {
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

export type CustomerUpdateInput = Partial<CustomerCreateInput> & {
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export interface CustomerQueryOptions {
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

function buildFilters(options: CustomerQueryOptions): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    role: "customer",
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

function buildSort(options: CustomerQueryOptions): Record<string, number> {
  const field = options.sort === "firstName"
    ? "firstName"
    : options.sort === "lastName"
      ? "lastName"
      : options.sort === "email"
        ? "email"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

export async function listCustomers(
  options: CustomerQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<ReturnType<typeof sanitiseUser>>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can view customer listings."), { status: 403 });
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
    data: data.map((customer) => sanitiseUser(customer)),
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getCustomerById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
  }

  const customer = await User.findOne({ _id: id, role: "customer" }).exec();
  if (!customer) {
    throw Object.assign(new Error("Customer not found."), { status: 404 });
  }

  if (userRole !== "admin" && String(customer._id) !== userId) {
    throw Object.assign(new Error("Access denied. You can only view your own customer record."), { status: 403 });
  }

  return sanitiseUser(customer);
}

export async function createCustomer(
  input: CustomerCreateInput,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (userRole !== "admin") {
    throw Object.assign(new Error("Access denied. Only admins can create customers."), { status: 403 });
  }

  const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
  if (existing) {
    throw Object.assign(new Error("A customer with that email already exists."), { status: 409 });
  }

  const hashedPassword = await hashPassword(input.password);

  const customer = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    password: hashedPassword,
    phone: input.phone,
    avatar: input.avatar,
    bio: input.bio,
    address: input.address,
    role: "customer",
    isActive: true,
    isEmailVerified: false,
  });

  return sanitiseUser(customer);
}

export async function updateCustomer(
  id: string,
  input: CustomerUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<ReturnType<typeof sanitiseUser>> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
  }

  const customer = await User.findOne({ _id: id, role: "customer" }).exec();
  if (!customer) {
    throw Object.assign(new Error("Customer not found."), { status: 404 });
  }

  const isOwner = String(customer._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only update your own customer record."), { status: 403 });
  }

  if (userRole !== "admin") {
    if (input.isActive !== undefined || input.isEmailVerified !== undefined) {
      throw Object.assign(new Error("Access denied. Only admins can update account status fields."), { status: 403 });
    }
  }

  if (input.email && input.email.toLowerCase().trim() !== customer.email) {
    const existing = await User.findOne({ email: input.email.toLowerCase().trim() }).exec();
    if (existing && String(existing._id) !== String(customer._id)) {
      throw Object.assign(new Error("A customer with that email already exists."), { status: 409 });
    }
    customer.email = input.email.toLowerCase().trim();
  }

  if (input.firstName !== undefined) {
    customer.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    customer.lastName = input.lastName.trim();
  }

  if (input.password !== undefined) {
    customer.password = await hashPassword(input.password);
  }

  if (input.phone !== undefined) {
    customer.phone = input.phone;
  }

  if (input.avatar !== undefined) {
    customer.avatar = input.avatar;
  }

  if (input.bio !== undefined) {
    customer.bio = input.bio;
  }

  if (input.address !== undefined) {
    customer.address = input.address;
  }

  if (input.isActive !== undefined) {
    customer.isActive = input.isActive;
  }

  if (input.isEmailVerified !== undefined) {
    customer.isEmailVerified = input.isEmailVerified;
  }

  await customer.save();
  return sanitiseUser(customer);
}

export async function deleteCustomer(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid customer ID."), { status: 400 });
  }

  const customer = await User.findOne({ _id: id, role: "customer" }).exec();
  if (!customer) {
    throw Object.assign(new Error("Customer not found."), { status: 404 });
  }

  const isOwner = String(customer._id) === userId;
  if (userRole !== "admin" && !isOwner) {
    throw Object.assign(new Error("Access denied. You can only delete your own customer account."), { status: 403 });
  }

  await User.findByIdAndDelete(id).exec();
}
