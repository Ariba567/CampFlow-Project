import api from '@/config/axios';
import type { ApiItem, Page } from '@/services/operationsDashboardService';

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

export async function listAdminCampgrounds(params: Record<string, unknown> = {}) {
  return (await api.get<Page<ApiItem>>('/campgrounds', { params: { page: 1, limit: 20, ...params } })).data;
}

export async function getAdminCampground(id: string) { return unwrap(await api.get<{ data: ApiItem }>(`/campgrounds/${id}`)); }
export async function createAdminCampground(input: ApiItem) { return unwrap(await api.post<{ data: ApiItem }>('/campgrounds', input)); }
export async function updateAdminCampground(id: string, input: ApiItem) { return unwrap(await api.patch<{ data: ApiItem }>(`/campgrounds/${id}`, input)); }

export async function listPricingRules(params: Record<string, unknown> = {}) {
  return (await api.get<Page<ApiItem>>('/pricing', { params: { page: 1, limit: 20, ...params } })).data;
}

export async function createPricingRule(input: ApiItem) { return unwrap(await api.post<{ data: ApiItem }>('/pricing', input)); }
export async function updatePricingRule(id: string, input: ApiItem) { return unwrap(await api.patch<{ data: ApiItem }>(`/pricing/${id}`, input)); }
export async function deletePricingRule(id: string) { await api.delete(`/pricing/${id}`); }

export async function listAdminUsers(params: Record<string, unknown> = {}) {
  return (await api.get<Page<ApiItem>>('/dashboard/admin/users', { params: { page: 1, limit: 20, ...params } })).data;
}

const userPath = (role: string) => role === 'manager' ? '/managers' : role === 'admin' ? '/administrators' : '/customers';
export async function getManagedUser(id: string, role: string) { return unwrap(await api.get<{ data: ApiItem }>(`${userPath(role)}/${id}`)); }
export async function createManagedUser(role: string, input: ApiItem) { return unwrap(await api.post<{ data: ApiItem }>(userPath(role), input)); }
export async function updateManagedUser(id: string, role: string, input: ApiItem) { return unwrap(await api.patch<{ data: ApiItem }>(`${userPath(role)}/${id}`, input)); }
export async function deleteManagedUser(id: string, role: string) { await api.delete(`${userPath(role)}/${id}`); }
export async function reassignUserRole(id: string, role: 'customer' | 'manager' | 'admin') { return unwrap(await api.patch<{ data: ApiItem }>(`/users/${id}/role`, { role })); }

async function fetchEveryPage(path: string, params: Record<string, unknown> = {}): Promise<ApiItem[]> {
  const first = (await api.get<Page<ApiItem>>(path, { params: { page: 1, limit: 100, ...params } })).data;
  const pages = Array.from({ length: Math.max(first.meta.totalPages - 1, 0) }, (_, index) => index + 2);
  const remaining = await Promise.all(pages.map(async (page) => (await api.get<Page<ApiItem>>(path, { params: { page, limit: 100, ...params } })).data.data));
  return [ ...first.data, ...remaining.flat() ];
}

export async function loadAnalyticsSourceData() {
  const [reservations, payments, campgrounds] = await Promise.all([
    fetchEveryPage('/reservations', { sort: 'checkIn', order: 'asc' }),
    fetchEveryPage('/payments', { sort: 'createdAt', order: 'asc' }),
    fetchEveryPage('/campgrounds', { sort: 'name', order: 'asc' }),
  ]);
  return { reservations, payments, campgrounds };
}
