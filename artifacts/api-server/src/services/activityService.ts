import mongoose from "mongoose";
import Activity, { IActivity } from "../models/Activity";
import Campground from "../models/Campground";
import { UserRole } from "../models/User";

export interface ActivityCreateInput {
  campground: string;
  name: string;
  description: string;
  type: string;
  difficulty: "easy" | "moderate" | "hard" | "expert";
  durationMinutes: number;
  price: number;
  isIncluded: boolean;
  images?: string[];
  schedule?: Array<{
    day: string;
    startTime: string;
    endTime: string;
    maxParticipants?: number;
  }>;
  minParticipants?: number;
  maxParticipants?: number;
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  requirements?: string[];
  equipment?: string[];
  isActive?: boolean;
}

export type ActivityUpdateInput = Partial<ActivityCreateInput>;

export interface ActivityQueryOptions {
  page: number;
  limit: number;
  sort?: "name" | "price" | "duration" | "createdAt";
  order: "asc" | "desc";
  search?: string;
  campground?: string;
  type?: string;
  difficulty?: "easy" | "moderate" | "hard" | "expert";
  isIncluded?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: ActivityQueryOptions) {
  const filters: Record<string, unknown> = {};

  if (options.campground && mongoose.isValidObjectId(options.campground)) {
    filters.campground = new mongoose.Types.ObjectId(options.campground);
  }

  if (options.type) {
    filters.type = new RegExp(`^${options.type.trim()}$`, "i");
  }

  if (options.difficulty) {
    filters.difficulty = options.difficulty;
  }

  if (typeof options.isIncluded === "boolean") {
    filters.isIncluded = options.isIncluded;
  }

  if (typeof options.isActive === "boolean") {
    filters.isActive = options.isActive;
  } else {
    filters.isActive = true;
  }

  if (typeof options.minPrice === "number") {
    filters.price = { ...(filters.price as Record<string, unknown>), $gte: options.minPrice };
  }

  if (typeof options.maxPrice === "number") {
    filters.price = { ...(filters.price as Record<string, unknown>), $lte: options.maxPrice };
  }

  if (options.search?.trim()) {
    const query = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(query, "i");
    filters.$or = [
      { name: regex },
      { description: regex },
      { type: regex },
      { requirements: regex },
      { equipment: regex },
    ];
  }

  return filters;
}

function buildSort(options: ActivityQueryOptions): Record<string, number> {
  const field: string = options.sort === "price"
    ? "price"
    : options.sort === "duration"
      ? "durationMinutes"
      : options.sort === "name"
        ? "name"
        : "createdAt";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

async function getManagerCampgroundIds(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id");
  return campgrounds.map((campground) => campground._id);
}

export async function listActivities(
  options: ActivityQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<IActivity>> {
  const filters = buildFilters(options);

  if (userRole === "manager") {
    const ownedCampgrounds = await getManagerCampgroundIds(userId);
    if (ownedCampgrounds.length === 0) {
      return { data: [], total: 0, page: options.page, limit: options.limit, totalPages: 1 };
    }

    if (options.campground && !ownedCampgrounds.some((id) => id.equals(options.campground))) {
      throw Object.assign(new Error("Access denied. You can only view activities for your own campgrounds."), {
        status: 403,
      });
    }

    filters.campground = { $in: ownedCampgrounds };
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Activity.find(filters)
      .sort(sort as any)
      .skip(skip)
      .limit(options.limit)
      .populate("campground", "name slug address")
      .exec(),
    Activity.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getActivityById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<IActivity> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid activity ID."), { status: 400 });
  }

  const activity = await Activity.findById(id)
    .populate("campground", "name slug address manager")
    .exec();

  if (!activity) {
    throw Object.assign(new Error("Activity not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (activity.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only view activities for your own campgrounds."), {
        status: 403,
      });
    }
  }

  return activity;
}

async function ensureManagerOwnsCampground(userId: string, campgroundId: string): Promise<void> {
  const campground = await Campground.findById(campgroundId).select("manager");
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }

  if (String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only manage activities for your own campgrounds."), {
      status: 403,
    });
  }
}

export async function createActivity(
  input: ActivityCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IActivity> {
  if (userRole === "manager") {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  return Activity.create({
    ...input,
    campground: new mongoose.Types.ObjectId(input.campground),
  });
}

export async function updateActivity(
  id: string,
  input: ActivityUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IActivity> {
  const activity = await Activity.findById(id).populate("campground", "manager").exec();
  if (!activity) {
    throw Object.assign(new Error("Activity not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (activity.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update activities for your own campgrounds."), {
        status: 403,
      });
    }
  }

  if (input.campground && userRole === "manager") {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  Object.assign(activity, {
    ...input,
    ...(input.campground ? { campground: new mongoose.Types.ObjectId(input.campground) } : {}),
  });

  await activity.save();
  return activity;
}

export async function deleteActivity(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const activity = await Activity.findById(id).populate("campground", "manager").exec();
  if (!activity) {
    throw Object.assign(new Error("Activity not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (activity.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only delete activities for your own campgrounds."), {
        status: 403,
      });
    }
  }

  await activity.deleteOne();
}
