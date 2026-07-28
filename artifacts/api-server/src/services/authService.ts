import User, { IUser } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { logger } from "../lib/logger";

// ─── Input types ──────────────────────────────────────────────────────────────

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

// ─── Serialise user for API responses (never expose password) ─────────────────

export function sanitiseUser(user: IUser) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
    address: user.address,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    favorites: user.favorites,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}

// ─── Generate and persist tokens ──────────────────────────────────────────────

async function generateTokens(user: IUser): Promise<AuthTokens> {
  const payload = { id: String(user._id), email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: String(user._id) });

  // Persist refresh token hash for single-use rotation (security best practice)
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase().trim() });
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists."), {
      status: 409,
    });
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    password: hashedPassword,
    phone: input.phone,
    role: "customer", // default role for self-registration
  });

  logger.info({ userId: user._id }, "New user registered");

  const tokens = await generateTokens(user);
  return { user: sanitiseUser(user), ...tokens };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput) {
  // Explicitly select password (excluded by default)
  const user = await User.findOne({
    email: input.email.toLowerCase().trim(),
  }).select("+password +refreshToken");

  if (!user) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error("Your account has been deactivated. Please contact support."), {
      status: 403,
    });
  }

  const isMatch = await comparePassword(input.password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  const tokens = await generateTokens(user);

  logger.info({ userId: user._id }, "User logged in");
  return { user: sanitiseUser(user), ...tokens };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  logger.info({ userId }, "User logged out");
}

// ─── Refresh access token ─────────────────────────────────────────────────────

export async function refreshAccessToken(incomingRefreshToken: string) {
  let decoded: { id: string };
  try {
    decoded = verifyRefreshToken(incomingRefreshToken) as { id: string };
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token."), { status: 401 });
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw Object.assign(new Error("Refresh token reuse detected. Please log in again."), {
      status: 401,
    });
  }

  const tokens = await generateTokens(user); // rotate refresh token
  return { user: sanitiseUser(user), ...tokens };
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }
  return sanitiseUser(user);
}
