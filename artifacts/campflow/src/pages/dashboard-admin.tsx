import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, MapPinned, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { apiError, getOperationsSummary, type ApiItem } from '@/services/operationsDashboardService';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ApiItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const role = user?.role === 'admin' ? 'admin' : 'manager';
  useEffect(() => {
    getOperationsSummary(role)
      .then(setSummary)
      .catch((caught) => setError(apiError(caught, 'We could not load your operations overview.')));
  }, [role]);

  if (error) return <ErrorState title="Dashboard unavailable" message={error} />;
  if (!summary)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );

  const managerStats =
    role === 'manager'
      ? [
          { label: 'Upcoming arrivals', value: summary.upcomingReservations ?? 0, icon: CalendarDays },
          { label: 'Awaiting approval', value: summary.pendingReservations ?? 0, icon: Clock3 },
          { label: 'Revenue to date', value: `$${Number(summary.revenue ?? 0).toLocaleString()}`, icon: CircleDollarSign },
          { label: 'Unread updates', value: summary.unreadNotifications ?? 0, icon: MapPinned },
        ]
      : [
          { label: 'All reservations', value: summary.totalReservations ?? 0, icon: CalendarDays },
          { label: 'Campgrounds', value: summary.totalCampgrounds ?? 0, icon: MapPinned },
          { label: 'Customers', value: summary.totalCustomers ?? 0, icon: UsersRound },
          { label: 'Total revenue', value: `$${Number(summary.totalRevenue ?? 0).toLocaleString()}`, icon: CircleDollarSign },
        ];

  return (
    <div className="space-y-10">
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{role === 'admin' ? 'Organization overview' : 'Operations overview'}</p>
          <h1 className="display-2 mt-3">Good to see you, {user?.firstName}.</h1>
          <p className="lede mt-3 max-w-xl">
            {role === 'admin'
              ? 'A clear view of performance across CampFlow — every campground, every stay.'
              : 'Keep arrivals, site readiness, and bookings moving smoothly across your campground.'}
          </p>
        </div>
        <Button asChild size="lg" className="rounded-md">
          <Link to="/dashboard/admin/reservations">
            Review bookings <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {managerStats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/70 bg-card shadow-soft transition-transform hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Live data
                </span>
              </div>
              <p className="display-3 mt-6 text-foreground">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-6 sm:p-8">
            <p className="eyebrow">Daily workflow</p>
            <h2 className="display-3 mt-3">Keep every stay on track.</h2>
            <p className="lede mt-3 max-w-md">
              Approve new requests, update stay statuses, and surface customer information from one operational workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-md">
                <Link to="/dashboard/admin/calendar">Open calendar</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link to="/dashboard/admin/campsites">Manage campsites</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-6 sm:p-8">
            <p className="eyebrow">Access scope</p>
            <h2 className="display-3 mt-3">
              {role === 'admin' ? 'Organization-wide control' : 'Your campground operations'}
            </h2>
            <p className="lede mt-3">
              {role === 'admin'
                ? 'You can view and manage reservations and campsites across the organization.'
                : 'Your data and actions are scoped by the backend to campgrounds you manage.'}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}