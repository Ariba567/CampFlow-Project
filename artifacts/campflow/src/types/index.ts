// ─── User roles ───────────────────────────────────────────────────────────────
export type UserRole = "guest" | "customer" | "manager" | "admin";

// ─── User ─────────────────────────────────────────────────────────────────────
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: IAddress;
  isActive: boolean;
  isEmailVerified: boolean;
  favorites: string[];
  lastLogin?: string;
  createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  message: string;
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── Campground ───────────────────────────────────────────────────────────────
export interface ICampground {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
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
  images: string[];
  coverImage?: string;
  amenities: string[];
  categories: string[];
  tags: string[];
  rating: { average: number; count: number };
  isActive: boolean;
  isFeatured: boolean;
  totalSites: number;
}

// ─── Campsite ─────────────────────────────────────────────────────────────────
export type CampsiteType = "tent" | "rv" | "cabin" | "glamping" | "group";

export interface ICampsite {
  id: string;
  campground: string;
  name: string;
  siteNumber: string;
  type: CampsiteType;
  description: string;
  images: string[];
  capacity: {
    maxGuests: number;
    maxTents?: number;
    maxRvLength?: number;
  };
  amenities: string[];
  basePrice: number;
  weekendPrice?: number;
  isActive: boolean;
  isAvailable: boolean;
  features: string[];
  rating: { average: number; count: number };
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface IReservation {
  id: string;
  reservationNumber: string;
  customer: string | IUser;
  campsite: string | ICampsite;
  campground: string | ICampground;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children: number; vehicles: number };
  status: ReservationStatus;
  pricing: {
    baseRate: number;
    nights: number;
    subtotal: number;
    taxes: number;
    fees: number;
    discount: number;
    total: number;
  };
  specialRequests?: string;
  nights: number;
  createdAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface IReview {
  id: string;
  customer: string | IUser;
  campground: string | ICampground;
  overallRating: number;
  title: string;
  body: string;
  images: string[];
  isApproved: boolean;
  createdAt: string;
}
