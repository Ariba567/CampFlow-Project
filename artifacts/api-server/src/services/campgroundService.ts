import mongoose from "mongoose";
import Campground, { ICampground } from "../models/Campground";
import { UserRole } from "../models/User";

export interface CampgroundCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  images?: string[];
  coverImage?: string;
  amenities?: string[];
  categories: string[];
  tags?: string[];
  operatingHours?: {
    checkIn?: string;
    checkOut?: string;
    open?: string;
    close?: string;
  };
  rules?: string[];
  petPolicy?: "allowed" | "not_allowed" | "restricted";
  isActive?: boolean;
  isFeatured?: boolean;
  totalSites?: number;
}

export type CampgroundUpdateInput = Partial<CampgroundCreateInput>;

export interface CampgroundQueryOptions {
  page: number;
  limit: number;
  sort?: "name" | "rating" | "totalSites" | "createdAt" | "isFeatured";
  order: "asc" | "desc";
  search?: string;
  categories?: string[];
  tags?: string[];
  amenities?: string[];
  city?: string;
  state?: string;
  country?: string;
  manager?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function parseTextSearch(search?: string): boolean {
  return typeof search === "string" && search.trim().length > 0;
}

function buildFilters(options: CampgroundQueryOptions) {
  const filters: Record<string, unknown> = {};

  if (options.manager && mongoose.isValidObjectId(options.manager)) {
    filters.manager = new mongoose.Types.ObjectId(options.manager);
  }

  if (options.categories?.length) {
    filters.categories = { $in: options.categories };
  }

  if (options.tags?.length) {
    filters.tags = { $in: options.tags };
  }

  if (options.amenities?.length) {
    filters.amenities = { $all: options.amenities };
  }

  if (options.city) {
    filters["address.city"] = new RegExp(`^${options.city.trim()}$`, "i");
  }

  if (options.state) {
    filters["address.state"] = new RegExp(`^${options.state.trim()}$`, "i");
  }

  if (options.country) {
    filters["address.country"] = new RegExp(`^${options.country.trim()}$`, "i");
  }

  if (typeof options.isActive === "boolean") {
    filters.isActive = options.isActive;
  } else {
    filters.isActive = true;
  }

  if (typeof options.isFeatured === "boolean") {
    filters.isFeatured = options.isFeatured;
  }

  if (typeof options.minRating === "number") {
    filters["rating.average"] = { ...(filters["rating.average"] as Record<string, number>), $gte: options.minRating };
  }

  if (typeof options.maxRating === "number") {
    filters["rating.average"] = { ...(filters["rating.average"] as Record<string, number>), $lte: options.maxRating };
  }

  if (parseTextSearch(options.search)) {
    filters.$text = { $search: options.search?.trim() };
  }

  return filters;
}

function buildSort(options: CampgroundQueryOptions): Record<string, unknown> {
  if (options.search && !options.sort) {
    return { score: { $meta: "textScore" } };
  }

  const sortFields: Record<string, string> = {
    name: "name",
    rating: "rating.average",
    totalSites: "totalSites",
    createdAt: "createdAt",
    isFeatured: "isFeatured",
  };

  const field = options.sort ? sortFields[options.sort] : "createdAt";
  const direction = options.order === "asc" ? 1 : -1;

  return { [field]: direction };
}

export async function listCampgrounds(
  options: CampgroundQueryOptions,
): Promise<PaginatedResult<ICampground>> {
  const filters = buildFilters(options);
  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const query = Campground.find(filters)
    .sort(sort as mongoose.SortOrder)
    .skip(skip)
    .limit(options.limit);

  if (options.search && !options.sort) {
    query.select({ score: { $meta: "textScore" } });
  }

  const [data, total] = await Promise.all([
    query.exec(),
    Campground.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getCampgroundById(id: string): Promise<ICampground> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid campground ID."), { status: 400 });
  }

  const campground = await Campground.findById(id);
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  return campground;
}

export async function createCampground(
  input: CampgroundCreateInput,
  managerId: string,
): Promise<ICampground> {
  try {
    return await Campground.create({
      ...input,
      manager: new mongoose.Types.ObjectId(managerId),
    });
  } catch (err: unknown) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      throw Object.assign(new Error("A campground with the same name or slug already exists."), {
        status: 409,
      });
    }
    throw error;
  }
}

export async function updateCampground(
  id: string,
  input: CampgroundUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<ICampground> {
  const campground = await Campground.findById(id);
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  if (userRole === "manager" && String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only update your own campgrounds."), {
      status: 403,
    });
  }

  Object.assign(campground, input);

  try {
    await campground.save();
    return campground;
  } catch (err: unknown) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      throw Object.assign(new Error("A campground with the same name or slug already exists."), {
        status: 409,
      });
    }
    throw error;
  }
}

export async function deleteCampground(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const campground = await Campground.findById(id);
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  if (userRole === "manager" && String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only delete your own campgrounds."), {
      status: 403,
    });
  }

  await campground.deleteOne();
}
