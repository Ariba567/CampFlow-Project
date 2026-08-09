import api from '@/config/axios';

export type ApiItem = Record<string, any>;
export type Page<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
export const idOf = (item: ApiItem | string | undefined) => typeof item === 'string' ? item : String(item?._id ?? item?.id ?? '');
export const labelOf = (item: ApiItem | string | undefined, fallback = '—') => typeof item === 'string' ? fallback : String(item?.name ?? item?.siteNumber ?? item?.reservationNumber ?? fallback);

export async function listCampgrounds() { return (await api.get<Page<ApiItem>>('/campgrounds', { params: { page: 1, limit: 100, isActive: true } })).data.data; }
export async function getCampground(idOrSlug: string) { return (await api.get<{ data: ApiItem }>(`/campgrounds/${idOrSlug}`)).data.data; }
export async function listCampsites(campground?: string, type?: string) { return (await api.get<Page<ApiItem>>('/campsites', { params: { page: 1, limit: 100, campground, type, isAvailable: true } })).data.data; }
export async function listPricingRules(params: Record<string, unknown> = {}) { return (await api.get<Page<ApiItem>>('/pricing', { params: { page: 1, limit: 100, ...params } })).data; }
export async function listReservations(params: Record<string, unknown> = {}) { return (await api.get<Page<ApiItem>>('/reservations', { params: { page: 1, limit: 100, ...params } })).data; }
export async function getReservation(id: string) { return (await api.get<{ data: ApiItem }>(`/reservations/${id}`)).data.data; }
export async function quoteReservation(params: { campground?: string; campsite?: string; checkIn: string; checkOut: string }) { return (await api.get<{ data: ApiItem }>('/reservations/quote', { params })).data.data; }
export async function checkCampsiteAvailability(params: { campground?: string; campsite?: string; checkIn: string; checkOut: string }) { return (await api.get<{ data: ApiItem }>('/reservations/availability', { params })).data.data; }
export async function createReservation(input: ApiItem) { return (await api.post<{ data: ApiItem }>('/reservations', input)).data.data; }
export async function updateReservation(id: string, input: ApiItem) { return (await api.patch<{ data: ApiItem }>(`/reservations/${id}`, input)).data.data; }
export async function cancelReservation(id: string) { return (await api.patch<{ data: ApiItem }>(`/reservations/${id}/cancel`)).data.data; }
export async function listFavorites() { return (await api.get<Page<ApiItem>>('/dashboard/customer/favorites', { params: { page: 1, limit: 100 } })).data; }
export async function addFavorite(campsiteId: string) { return (await api.post(`/dashboard/customer/favorites/${campsiteId}`)).data; }
export async function removeFavorite(campsiteId: string) { return (await api.delete(`/dashboard/customer/favorites/${campsiteId}`)).data; }
export async function createContact(input: ApiItem) { return (await api.post<{ data: ApiItem }>('/contact', input)).data.data; }
export async function listPayments() { return (await api.get<Page<ApiItem>>('/payments', { params: { page: 1, limit: 100 } })).data; }
export async function listNotifications() { return (await api.get<Page<ApiItem>>('/notifications', { params: { page: 1, limit: 100 } })).data; }
export async function listReviews() { return (await api.get<Page<ApiItem>>('/reviews', { params: { page: 1, limit: 100 } })).data; }
export async function createReview(input: ApiItem) { return (await api.post<{ data: ApiItem }>('/reviews', input)).data.data; }
export const apiError = (error: any, fallback: string) => String(error?.response?.data?.error ?? fallback);
export type UiNotification = { id: string; title: string; message: string; type: 'booking_confirmation' | 'booking_cancellation' | 'payment_confirmation'; createdAt: string; dedupeKey?: string };
const UI_NOTIFICATIONS_KEY = 'campflow_ui_notifications';
export function listUiNotifications(): UiNotification[] { try { return JSON.parse(localStorage.getItem(UI_NOTIFICATIONS_KEY) ?? '[]'); } catch { return []; } }
export function addUiNotification(notification: Omit<UiNotification, 'id' | 'createdAt'>) { const current = listUiNotifications(); const existing = notification.dedupeKey ? current.find((item) => item.dedupeKey === notification.dedupeKey) : undefined; if (existing) return existing; const next: UiNotification = { ...notification, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; localStorage.setItem(UI_NOTIFICATIONS_KEY, JSON.stringify([next, ...current].slice(0, 20))); return next; }
