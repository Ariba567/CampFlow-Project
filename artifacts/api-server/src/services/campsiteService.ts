import mongoose from "mongoose";
import Campsite, { ICampsite } from "../models/Campsite";
import Campground from "../models/Campground";
import { UserRole } from "../models/User";

export interface CampsiteCreateInput {
  campground: string;
  name: string;
  siteNumber: string;
  type: "tent" | "rv" | "cabin" | "glamping" | "group";
  description?: string;
  images?: string[];
  capacity: {
    maxGuests: number;
    maxTents?: number;
    maxRvLength?: number;
  };
  amenities?: string[];
  basePrice: number;
  weekendPrice?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  mapCoordinates?: {
    x?: number;
    y?: number;
  };
  features?: string[];
}

export type CampsiteUpdateInput = Partial<CampsiteCreateInput>;

export interface CampsiteQueryOptions {
  page: number;
  limit: number;
  sort?: "name" | "basePrice" | "weekendPrice" | "rating" | "createdAt";
  order: "asc" | "desc";
  search?: string;
  campground?: string;
  type?: "tent" | "rv" | "cabin" | "glamping" | "group";
  amenities?: string[];
  features?: string[];
  isActive?: boolean;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
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

function buildFilters(options: CampsiteQueryOptions) {
  const filters: Record<string, unknown> = {};

  if (options.campground && mongoose.isValidObjectId(options.campground)) {
    filters.campground = new mongoose.Types.ObjectId(options.campground);
  }

  if (options.type) {
    filters.type = options.type;
  }

  if (options.amenities?.length) {
    filters.amenities = { $all: options.amenities };
  }

  if (options.features?.length) {
    filters.features = { $all: options.features };
  }

  if (typeof options.isActive === "boolean") {
    filters.isActive = options.isActive;
  }

  if (typeof options.isAvailable === "boolean") {
    filters.isAvailable = options.isAvailable;
  }

  if (typeof options.minPrice === "number") {
    filters.basePrice = { ...(filters.basePrice as Record<string, number>), $gte: options.minPrice };
  }

  if (typeof options.maxPrice === "number") {
    filters.basePrice = { ...(filters.basePrice as Record<string, number>), $lte: options.maxPrice };
  }

  if (typeof options.minRating === "number") {
    filters["rating.average"] = {
      ...(filters["rating.average"] as Record<string, number>),
      $gte: options.minRating,
    };
  }

  if (typeof options.maxRating === "number") {
    filters["rating.average"] = {
      ...(filters["rating.average"] as Record<string, number>),
      $lte: options.maxRating,
    };
  }

  if (options.search?.trim()) {
    const term = options.search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filters.$or = [
      { name: regex },
      { description: regex },
      { features: regex },
      { amenities: regex },
    ];
  }

  return filters;
}

function buildSort(options: CampsiteQueryOptions): Record<string, unknown> {
  const fieldMap: Record<string, string> = {
    name: "name",
    basePrice: "basePrice",
    weekendPrice: "weekendPrice",
    rating: "rating.average",
    createdAt: "createdAt",
  };

  const field = options.sort ? fieldMap[options.sort] : "createdAt";
  const order = options.order === "asc" ? 1 : -1;

  return { [field]: order };
}

export async function listCampsites(
  options: CampsiteQueryOptions,
): Promise<PaginatedResult<ICampsite>> {
  const filters = buildFilters(options);
  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const query = Campsite.find(filters)
    .sort(sort as mongoose.SortOrder)
    .skip(skip)
    .limit(options.limit)
    .populate("campground", "name slug address city state country");

  const [data, total] = await Promise.all([
    query.exec(),
    Campsite.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getCampsiteById(id: string): Promise<ICampsite> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid campsite ID."), { status: 400 });
  }

  const campsite = await Campsite.findById(id).populate(
    "campground",
    "name slug address city state country manager",
  );
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  return campsite;
}

async function ensureCampgroundOwnership(
  campgroundId: string,
  userId: string,
): Promise<void> {
  const campground = await Campground.findById(campgroundId).select("manager");
  if (!campground) {
    throw Object.assign(new Error("Related campground not found."), { status: 404 });
  }

  if (String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only manage campsites for your own campgrounds."), {
      status: 403,
    });
  }
}

export async function createCampsite(
  input: CampsiteCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<ICampsite> {
  if (userRole === "manager") {
    await ensureCampgroundOwnership(input.campground, userId);
  }

  try {
    return await Campsite.create({
      ...input,
      campground: new mongoose.Types.ObjectId(input.campground),
    });
  } catch (err: unknown) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      throw Object.assign(new Error("A campsite with the same site number already exists in this campground."), {
        status: 409,
      });
    }
    throw error;
  }
}

export async function updateCampsite(
  id: string,
  input: CampsiteUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<ICampsite> {
  const campsite = await Campsite.findById(id).populate("campground", "manager");
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = campsite.campground as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update your own campsites."), {
        status: 403,
      });
    }
  }

  if (input.campground && userRole === "manager") {
    await ensureCampgroundOwnership(input.campground, userId);
  }

  Object.assign(campsite, {
    ...input,
    ...(input.campground ? { campground: new mongoose.Types.ObjectId(input.campground) } : {}),
  });

  try {
    await campsite.save();
    return campsite;
  } catch (err: unknown) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      throw Object.assign(new Error("A campsite with the same site number already exists in this campground."), {
        status: 409,
      });
    }
    throw error;
  }
}

export async function deleteCampsite(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const campsite = await Campsite.findById(id).populate("campground", "manager");
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = campsite.campground as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only delete your own campsites."), {
        status: 403,
      });
    }
  }

  await campsite.deleteOne();
}
