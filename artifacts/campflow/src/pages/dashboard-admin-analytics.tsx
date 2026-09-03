import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { BedDouble, CalendarDays, CircleDollarSign, Compass, Sparkles, UsersRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { apiError } from '@/services/operationsDashboardService';
import { loadAnalyticsSourceData } from '@/services/adminManagementService';
import { buildAnalyticsSnapshot, type AnalyticsSnapshot } from '@/services/analyticsService';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
  reservations: { label: 'Reservations', color: 'var(--color-chart-2)' },
  occupancy: { label: 'Occupancy', color: 'var(--color-chart-3)' },
};

export default function DashboardAdminAnalytics() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsSourceData()
      .then(({ reservations, payments, campgrounds }) =>
        setSnapshot(buildAnalyticsSnapshot(reservations, payments, campgrounds)),
      )
      .catch((caught) => setError(apiError(caught, 'We could not load organization analytics.')));
  }, []);

  if (error) return <ErrorState title="Analytics unavailable" message={error} />;
  if (!snapshot)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );

  const pieData = snapshot.occupancyBreakdown.filter((item) => item.value > 0);
  const topPerformer = snapshot.campgroundPerformance[0];
  const totalSeasonalReservations = snapshot.seasonalPerformance.reduce((sum, item) => sum + item.reservations, 0);
  const strongestSeason = snapshot.seasonalPerformance.reduce((peak, item) => (item.revenue > peak.revenue ? item : peak), snapshot.seasonalPerformance[0]);

  return (
    <div className="space-y-8">
      <section className="border-b border-border/60 pb-8">
        <p className="eyebrow">Administrator</p>
        <h1 className="mt-3 display-2">Reports &amp; analytics</h1>
        <p className="lede mt-4 max-w-2xl">
          An organization-wide view, calculated from your live reservations, payments, and campground data—rendered as a field
          journal of the season.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Volume"
          label="Total reservations"
          value={snapshot.totalReservations.toLocaleString()}
          detail="All booked stays"
          icon={CalendarDays}
        />
        <KpiCard
          eyebrow="Revenue"
          label="Collected revenue"
          value={currency.format(snapshot.completedRevenue)}
          detail="Completed payment activity"
          icon={CircleDollarSign}
        />
        <KpiCard
          eyebrow="Utilization"
          label="Occupancy rate"
          value={`${snapshot.occupancyRate.toFixed(1)}%`}
          detail={`${snapshot.averageStay.toFixed(1)} avg. nights per stay`}
          icon={BedDouble}
        />
        <KpiCard
          eyebrow="Audience"
          label="Unique customers"
          value={snapshot.uniqueCustomers.toLocaleString()}
          detail="Across non-cancelled stays"
          icon={UsersRound}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <NarrativeCard
          icon={Compass}
          label="Leading property"
          value={topPerformer?.name ?? '—'}
          detail={
            topPerformer
              ? `${topPerformer.reservations.toLocaleString()} reservations · ${currency.format(topPerformer.revenue)}`
              : 'Awaiting reservations'
          }
        />
        <NarrativeCard
          icon={Sparkles}
          label="Strongest season"
          value={strongestSeason?.season ?? '—'}
          detail={
            strongestSeason && totalSeasonalReservations
              ? `${strongestSeason.reservations.toLocaleString()} bookings · ${currency.format(strongestSeason.revenue)}`
              : 'Awaiting seasonal data'
          }
        />
        <NarrativeCard
          icon={BedDouble}
          label="Average stay"
          value={`${snapshot.averageStay.toFixed(1)} nights`}
          detail="Across billable reservations"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        <Card className="overflow-hidden border-border/60 shadow-soft xl:col-span-3">
          <CardContent className="p-6">
            <ChartHeading eyebrow="Revenue overview" title="Revenue movement over time" />
            <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
              <LineChart data={snapshot.revenueTrend} margin={{ left: 4, right: 12, top: 12 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${Number(value) / 1000}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium">{currency.format(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: 'var(--color-chart-1)' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  fill="url(#revenueGradient)"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60 shadow-soft xl:col-span-2">
          <CardContent className="p-6">
            <ChartHeading eyebrow="Distribution" title="Occupancy by property" />
            {pieData.length ? (
              <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} strokeWidth={2} stroke="hsl(var(--background))">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} verticalAlign="bottom" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="mt-6 grid h-[280px] place-items-center text-sm text-muted-foreground">
                Occupancy data will appear once reservations exist.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        <Card className="overflow-hidden border-border/60 shadow-soft xl:col-span-3">
          <CardContent className="p-6">
            <ChartHeading eyebrow="Portfolio" title="Campground performance" />
            <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
              <BarChart data={snapshot.campgroundPerformance} margin={{ left: 4, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium">{currency.format(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60 shadow-soft xl:col-span-2">
          <CardContent className="p-6">
            <ChartHeading eyebrow="Seasonality" title="Revenue by season" />
            <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
              <BarChart data={snapshot.seasonalPerformance} margin={{ left: 4, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="season" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium">{currency.format(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({
  eyebrow,
  label,
  value,
  detail,
  icon: Icon,
}: {
  eyebrow: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 shadow-soft transition-transform hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <p className="mt-3 font-serif text-3xl tracking-tight">{value}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function NarrativeCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border/60 bg-card shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <p className="eyebrow">{label}</p>
        </div>
        <p className="mt-4 font-serif text-2xl tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ChartHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 display-3">{title}</h2>
    </div>
  );
}