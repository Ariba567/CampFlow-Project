import api from '@/config/axios';

export type ApiItem = Record<string, any>;
export type Page<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
export const idOf = (item: ApiItem | string | undefined) => typeof item === 'string' ? item : String(item?._id ?? item?.id ?? '');
export const labelOf = (item: ApiItem | string | undefined, fallback = '—') => typeof item === 'string' ? fallback : String(item?.name ?? item?.siteNumber ?? fallback);
export const apiError = (error: any, fallback: string) => String(error?.response?.data?.error ?? fallback);

export async function getOperationsSummary(role: 'manager' | 'admin') {
  return (await api.get<{ data: ApiItem }>(role === 'manager' ? '/dashboard/manager/summary' : '/dashboard/admin/summary')).data.data;
}

export async function listReservations(params: Record<string, unknown> = {}) {
  return (await api.get<Page<ApiItem>>('/reservations', { params: { page: 1, limit: 20, sort: 'checkIn', order: 'asc', ...params } })).data;
}

export async function updateReservationStatus(id: string, status: string) {
  return (await api.patch<{ data: ApiItem }>(`/reservations/${id}`, { status })).data.data;
}

export async function listCampsites(role: 'manager' | 'admin', params: Record<string, unknown> = {}) {
  const path = role === 'manager' ? '/dashboard/manager/campsites' : '/campsites';
  return (await api.get<Page<ApiItem>>(path, { params: { page: 1, limit: 20, ...params } })).data;
}

export async function listCampgrounds() {
  return (await api.get<Page<ApiItem>>('/campgrounds', { params: { page: 1, limit: 100, isActive: true } })).data.data;
}

export async function createCampsite(input: ApiItem) { return (await api.post<{ data: ApiItem }>('/campsites', input)).data.data; }
export async function updateCampsite(id: string, input: ApiItem) { return (await api.patch<{ data: ApiItem }>(`/campsites/${id}`, input)).data.data; }
export async function deleteCampsite(id: string) { await api.delete(`/campsites/${id}`); }

export async function getCustomer(id: string) { return (await api.get<{ data: ApiItem }>(`/customers/${id}`)).data.data; }
