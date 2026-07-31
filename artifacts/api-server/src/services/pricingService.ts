import mongoose from "mongoose";
import Pricing, { IPricing } from "../models/Pricing";
import Campground from "../models/Campground";
import Campsite from "../models/Campsite";
import { UserRole } from "../models/User";

export interface PricingCreateInput {
  name: string;
  campground: string;
  campsite?: string;
  type: "seasonal" | "weekend" | "holiday" | "promotional";
  applyMode: "multiplier" | "flat_rate" | "override";
  multiplier?: number;
  flatRate?: number;
  startDate: Date;
  endDate: Date;
  daysOfWeek?: number[];
  couponCode?: string;
  maxUses?: number;
  priority?: number;
  isActive?: boolean;
  description?: string;
}

export type PricingUpdateInput = Partial<PricingCreateInput>;

export interface PricingQueryOptions {
  page: number;
  limit: number;
  sort?: "priority" | "startDate" | "endDate" | "name";
  order: "asc" | "desc";
  search?: string;
  campground?: string;
  campsite?: string;
  type?: "seasonal" | "weekend" | "holiday" | "promotional";
  applyMode?: "multiplier" | "flat_rate" | "override";
  isActive?: boolean;
  couponCode?: string;
  minPriority?: number;
  maxPriority?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilters(options: PricingQueryOptions) {
  const filters: Record<string, unknown> = {};

  if (options.campground && mongoose.isValidObjectId(options.campground)) {
    filters.campground = new mongoose.Types.ObjectId(options.campground);
  }

  if (options.campsite && mongoose.isValidObjectId(options.campsite)) {
    filters.campsite = new mongoose.Types.ObjectId(options.campsite);
  }

  if (options.type) {
    filters.type = options.type;
  }

  if (options.applyMode) {
    filters.applyMode = options.applyMode;
  }

  if (typeof options.isActive === "boolean") {
    filters.isActive = options.isActive;
  }

  if (options.couponCode) {
    filters.couponCode = new RegExp(`^${options.couponCode.trim()}$`, "i");
  }

  if (typeof options.minPriority === "number") {
    filters.priority = { ...(filters.priority as Record<string, unknown>), $gte: options.minPriority };
  }

  if (typeof options.maxPriority === "number") {
    filters.priority = { ...(filters.priority as Record<string, unknown>), $lte: options.maxPriority };
  }

  if (options.search?.trim()) {
    const query = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(query, "i");
    filters.$or = [
      { name: regex },
      { description: regex },
      { couponCode: regex },
    ];
  }

  return filters;
}

function buildSort(options: PricingQueryOptions): Record<string, number> {
  const field = options.sort === "priority"
    ? "priority"
    : options.sort === "startDate"
      ? "startDate"
      : options.sort === "endDate"
        ? "endDate"
        : options.sort === "name"
          ? "name"
          : "priority";

  return { [field]: options.order === "asc" ? 1 : -1 };
}

async function getManagerCampgroundIds(userId: string) {
  const campgrounds = await Campground.find({ manager: userId }).select("_id");
  return campgrounds.map((campground) => campground._id);
}

async function ensureManagerOwnsCampground(userId: string, campgroundId: string) {
  const campground = await Campground.findById(campgroundId).select("manager");
  if (!campground) {
    throw Object.assign(new Error("Campground not found."), { status: 404 });
  }
  if (String(campground.manager) !== userId) {
    throw Object.assign(new Error("Access denied. You can only manage pricing rules for your own campgrounds."), {
      status: 403,
    });
  }
}

async function validateCampsiteBelongsToCampground(campsiteId: string, campgroundId: string) {
  const campsite = await Campsite.findById(campsiteId).select("campground");
  if (!campsite) {
    throw Object.assign(new Error("Campsite not found."), { status: 404 });
  }
  if (!campsite.campground || String(campsite.campground) !== campgroundId) {
    throw Object.assign(new Error("The campsite does not belong to the specified campground."), {
      status: 400,
    });
  }
}

export async function listPricing(
  options: PricingQueryOptions,
  userId: string,
  userRole: UserRole,
): Promise<PaginatedResult<IPricing>> {
  const filters = buildFilters(options);

  if (userRole === "manager") {
    const ownedCampgrounds = await getManagerCampgroundIds(userId);
    if (ownedCampgrounds.length === 0) {
      return { data: [], total: 0, page: options.page, limit: options.limit, totalPages: 1 };
    }

    if (options.campground && !ownedCampgrounds.some((id) => id.equals(options.campground))) {
      throw Object.assign(new Error("Access denied. You can only view pricing for your own campgrounds."), {
        status: 403,
      });
    }

    filters.campground = { $in: ownedCampgrounds };
  }

  const sort = buildSort(options);
  const skip = (options.page - 1) * options.limit;

  const [data, total] = await Promise.all([
    Pricing.find(filters)
      .sort(sort as any)
      .skip(skip)
      .limit(options.limit)
      .populate("campground", "name slug")
      .populate("campsite", "name siteNumber")
      .exec(),
    Pricing.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(Math.ceil(total / options.limit), 1),
  };
}

export async function getPricingById(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<IPricing> {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error("Invalid pricing ID."), { status: 400 });
  }

  const pricing = await Pricing.findById(id)
    .populate("campground", "name slug manager")
    .populate("campsite", "name siteNumber")
    .exec();

  if (!pricing) {
    throw Object.assign(new Error("Pricing rule not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (pricing.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only view pricing for your own campgrounds."), {
        status: 403,
      });
    }
  }

  return pricing;
}

export async function createPricing(
  input: PricingCreateInput,
  userId: string,
  userRole: UserRole,
): Promise<IPricing> {
  if (userRole === "manager") {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  if (input.campsite) {
    await validateCampsiteBelongsToCampground(input.campsite, input.campground);
  }

  return Pricing.create({
    ...input,
    campground: new mongoose.Types.ObjectId(input.campground),
    campsite: input.campsite ? new mongoose.Types.ObjectId(input.campsite) : undefined,
  });
}

export async function updatePricing(
  id: string,
  input: PricingUpdateInput,
  userId: string,
  userRole: UserRole,
): Promise<IPricing> {
  const pricing = await Pricing.findById(id).populate("campground", "manager").exec();
  if (!pricing) {
    throw Object.assign(new Error("Pricing rule not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (pricing.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only update pricing for your own campgrounds."), {
        status: 403,
      });
    }
  }

  const campgroundId = input.campground ? input.campground : String(pricing.campground);
  if (userRole === "manager" && input.campground) {
    await ensureManagerOwnsCampground(userId, input.campground);
  }

  if (input.campsite) {
    await validateCampsiteBelongsToCampground(input.campsite, campgroundId);
  }

  Object.assign(pricing, {
    ...input,
    ...(input.campground ? { campground: new mongoose.Types.ObjectId(input.campground) } : {}),
    ...(input.campsite ? { campsite: new mongoose.Types.ObjectId(input.campsite) } : {}),
  });

  await pricing.save();
  return pricing;
}

export async function deletePricing(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const pricing = await Pricing.findById(id).populate("campground", "manager").exec();
  if (!pricing) {
    throw Object.assign(new Error("Pricing rule not found."), { status: 404 });
  }

  if (userRole === "manager") {
    const campground = (pricing.campground as any) as { manager: mongoose.Types.ObjectId };
    if (!campground || String(campground.manager) !== userId) {
      throw Object.assign(new Error("Access denied. You can only delete pricing for your own campgrounds."), {
        status: 403,
      });
    }
  }

  await pricing.deleteOne();
}
