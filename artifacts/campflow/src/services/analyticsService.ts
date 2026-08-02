import type { ApiItem } from '@/services/operationsDashboardService';

const identifier = (value: ApiItem | string | undefined) => typeof value === 'string' ? value : String(value?._id ?? value?.id ?? '');
const title = (value: ApiItem | string | undefined, fallback = 'Unassigned') => typeof value === 'string' ? fallback : String(value?.name ?? fallback);
const date = (value: unknown) => {
  const parsed = new Date(String(value ?? ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const monthLabel = (value: Date) => value.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

export type AnalyticsSnapshot = {
  totalReservations: number;
  completedRevenue: number;
  occupancyRate: number;
  uniqueCustomers: number;
  averageStay: number;
  revenueTrend: { month: string; revenue: number; reservations: number }[];
  campgroundPerformance: { name: string; reservations: number; revenue: number; occupancy: number }[];
  seasonalPerformance: { season: string; reservations: number; revenue: number }[];
  occupancyBreakdown: { name: string; value: number; fill: string }[];
};

export function buildAnalyticsSnapshot(reservations: ApiItem[], payments: ApiItem[], campgrounds: ApiItem[]): AnalyticsSnapshot {
  const billable = reservations.filter((reservation) => !['cancelled', 'no_show'].includes(String(reservation.status)));
  const completedPayments = payments.filter((payment) => ['completed', 'partial_refund', 'refunded'].includes(String(payment.status)));
  const revenueByReservation = new Map<string, number>();
  completedPayments.forEach((payment) => {
    const reservationId = identifier(payment.reservation);
    const refunds = Array.isArray(payment.refunds) ? payment.refunds.reduce((sum: number, item: ApiItem) => sum + Number(item.amount ?? 0), 0) : 0;
    revenueByReservation.set(reservationId, (revenueByReservation.get(reservationId) ?? 0) + Math.max(Number(payment.amount ?? 0) - refunds, 0));
  });
  const completedRevenue = [...revenueByReservation.values()].reduce((sum, amount) => sum + amount, 0);
  const monthly = new Map<string, { month: string; revenue: number; reservations: number; order: number }>();
  const campgroundStats = new Map<string, { name: string; reservations: number; revenue: number; nights: number }>();
  const seasonal = new Map<string, { season: string; reservations: number; revenue: number }>();
  const customers = new Set<string>();
  let totalNights = 0;

  billable.forEach((reservation) => {
    const checkIn = date(reservation.checkIn);
    if (!checkIn) return;
    const key = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
    const revenue = revenueByReservation.get(identifier(reservation)) ?? Number(reservation.pricing?.total ?? 0);
    const currentMonth = monthly.get(key) ?? { month: monthLabel(checkIn), revenue: 0, reservations: 0, order: checkIn.getTime() };
    currentMonth.revenue += revenue;
    currentMonth.reservations += 1;
    monthly.set(key, currentMonth);

    const campgroundId = identifier(reservation.campground);
    const currentCampground = campgroundStats.get(campgroundId) ?? { name: title(reservation.campground), reservations: 0, revenue: 0, nights: 0 };
    const nights = Number(reservation.nights ?? reservation.pricing?.nights ?? 0);
    currentCampground.reservations += 1;
    currentCampground.revenue += revenue;
    currentCampground.nights += nights;
    campgroundStats.set(campgroundId, currentCampground);
    totalNights += nights;
    customers.add(identifier(reservation.customer));

    const season = checkIn.getMonth() === 11 || checkIn.getMonth() <= 1 ? 'Winter' : checkIn.getMonth() <= 4 ? 'Spring' : checkIn.getMonth() <= 7 ? 'Summer' : 'Autumn';
    const currentSeason = seasonal.get(season) ?? { season, reservations: 0, revenue: 0 };
    currentSeason.reservations += 1;
    currentSeason.revenue += revenue;
    seasonal.set(season, currentSeason);
  });

  const activeCapacity = campgrounds.reduce((sum, campground) => sum + (campground.isActive === false ? 0 : Number(campground.totalSites ?? 0)), 0);
  const periodDays = (() => {
    const visits = billable.map((reservation) => date(reservation.checkIn)).filter((value): value is Date => !!value);
    if (!visits.length) return 0;
    return Math.max(Math.ceil((Math.max(...visits.map(Number)) - Math.min(...visits.map(Number))) / 86_400_000) + 1, 1);
  })();
  const occupancyRate = activeCapacity && periodDays ? Math.min((totalNights / (activeCapacity * periodDays)) * 100, 100) : 0;
  const performance = campgrounds.map((campground) => {
    const current = campgroundStats.get(identifier(campground)) ?? { name: campground.name ?? 'Campground', reservations: 0, revenue: 0, nights: 0 };
    const capacity = Number(campground.totalSites ?? 0);
    return { name: current.name, reservations: current.reservations, revenue: current.revenue, occupancy: periodDays && capacity ? Math.min((current.nights / (capacity * periodDays)) * 100, 100) : 0 };
  }).sort((left, right) => right.revenue - left.revenue);
  const chartColors = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

  return {
    totalReservations: reservations.length,
    completedRevenue,
    occupancyRate,
    uniqueCustomers: [...customers].filter(Boolean).length,
    averageStay: billable.length ? totalNights / billable.length : 0,
    revenueTrend: [...monthly.values()].sort((left, right) => left.order - right.order).map(({ order: _order, ...item }) => item),
    campgroundPerformance: performance,
    seasonalPerformance: ['Winter', 'Spring', 'Summer', 'Autumn'].map((season) => seasonal.get(season) ?? { season, reservations: 0, revenue: 0 }),
    occupancyBreakdown: performance.map((item, index) => ({ name: item.name, value: Number(item.occupancy.toFixed(1)), fill: chartColors[index % chartColors.length] })),
  };
}
