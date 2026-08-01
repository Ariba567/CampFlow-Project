import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <NavLink to="/" className="flex items-center gap-3 text-base font-semibold text-foreground">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            CF
          </span>
          <span>CampFlow</span>
        </NavLink>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground md:flex">
          <NavLink to="/campgrounds" className={({ isActive }) => isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'}>
            Campgrounds
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'}>
            Pricing
          </NavLink>
          <NavLink to="/activities" className={({ isActive }) => isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'}>
            Activities
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'}>
            About
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? <>
            <Button asChild variant="outline" size="sm"><Link to={user?.role === 'customer' ? '/dashboard/profile' : '/dashboard'}>My account</Link></Button>
            <Button variant="default" size="sm" onClick={() => void signOut()}>Sign out</Button>
          </> : <>
            <Button asChild variant="outline" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild variant="default" size="sm"><Link to="/register">Get started</Link></Button>
          </>}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
