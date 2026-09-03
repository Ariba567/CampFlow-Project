import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, ChevronLeft, LayoutDashboard, LogOut, MapPinned, Menu, Tags, Trees, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/admin/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/dashboard/admin/calendar', label: 'Booking calendar', icon: CalendarDays },
  { to: '/dashboard/admin/campsites', label: 'Campsites', icon: MapPinned },
  { to: '/dashboard/admin/customers', label: 'Customers', icon: UsersRound },
  { to: '/dashboard/admin/pricing', label: 'Pricing', icon: Tags },
];

const adminNavigation = [
  { to: '/dashboard/admin/campgrounds', label: 'Campgrounds', icon: MapPinned },
  { to: '/dashboard/admin/users', label: 'Users', icon: UsersRound },
  { to: '/dashboard/admin/analytics', label: 'Reports & analytics', icon: BarChart3 },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? [...navigation, ...adminNavigation] : navigation;
  const roleLabel = isAdmin ? 'Administrator' : 'Campground manager';
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-6">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-md">
          <Trees className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="leading-tight">
          <p className="font-serif text-lg font-medium tracking-tight text-sidebar-foreground">CampFlow</p>
          <p className="mt-0.5 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
            {roleLabel}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="eyebrow text-sidebar-primary/90">Operations console</p>
        <p className="mt-1.5 font-serif text-sm leading-snug text-sidebar-foreground/80">
          {isAdmin ? 'Manage every campground in the network.' : 'Run arrivals, sites, and bookings.'}
        </p>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive &&
                  'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to site
        </NavLink>
      </div>
    </div>
  );
}

export default function OperationsLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <Navigation />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[73px] items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open dashboard navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Navigation />
              </SheetContent>
            </Sheet>
            <nav aria-label="Breadcrumb" className="hidden text-sm text-muted-foreground md:flex md:items-center md:gap-2">
              <span className="text-foreground/70">CampFlow</span>
              <span className="text-foreground/30">/</span>
              <span className="capitalize">{user?.role === 'admin' ? 'Admin' : 'Manager'}</span>
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-serif text-sm font-medium text-primary sm:hidden">
              {user?.firstName?.[0] ?? 'C'}
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main className="container-page py-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}