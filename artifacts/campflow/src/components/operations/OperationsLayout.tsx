import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, ChevronLeft, LayoutDashboard, LogOut, MapPinned, Menu, Mountain, Tags, UsersRound } from 'lucide-react';
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
  const links = user?.role === 'admin' ? [...navigation, ...adminNavigation] : navigation;
  return <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground"><div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Mountain className="h-5 w-5" /></span><div><p className="font-semibold leading-5">CampFlow</p><p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Campground manager'}</p></div></div><nav className="flex-1 space-y-1 overflow-y-auto p-3">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/dashboard/admin'} onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent/70', isActive && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary')}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav><div className="border-t border-sidebar-border p-3"><NavLink to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"><ChevronLeft className="h-4 w-4" />Back to site</NavLink></div></div>;
}

export default function OperationsLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/', { replace: true }); };
  return <div className="min-h-screen bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block"><Navigation /></aside><div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-[73px] items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6"><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /><span className="sr-only">Open dashboard navigation</span></Button></SheetTrigger><SheetContent side="left" className="w-72 p-0"><Navigation /></SheetContent></Sheet><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p><p className="text-xs capitalize text-muted-foreground">{user?.role}</p></div><Button variant="outline" size="sm" onClick={() => void signOut()}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></Button></div></header><main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>;
}
