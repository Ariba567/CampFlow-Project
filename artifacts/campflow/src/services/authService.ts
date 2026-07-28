import api, { tokenStorage } from "@/config/axios";
import type { AuthResponse, LoginInput, RegisterInput, IUser } from "@/types";

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data;
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    tokenStorage.clear();
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────
export async function getMe(): Promise<IUser> {
  const { data } = await api.get<{ user: IUser }>("/auth/me");
  return data.user;
}

// ─── Refresh tokens ───────────────────────────────────────────────────────────
export async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("No refresh token available");
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
    "/auth/refresh",
    { refreshToken },
  );
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data;
}
