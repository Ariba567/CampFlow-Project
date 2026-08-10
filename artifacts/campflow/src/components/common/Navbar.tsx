import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

const navLinkClass = ({ isActive }: { isActive: boolean }) => `relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform ${isActive ? 'text-primary after:scale-x-100' : 'text-foreground/80 hover:text-foreground after:scale-x-0 hover:after:scale-x-100'}`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="border-b border-border bg-card/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <NavLink to="/" className="group flex items-center gap-3 text-base font-semibold text-foreground">
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-1 ring-primary-foreground/10 transition-transform duration-200 group-hover:-translate-y-0.5">
            <Trees className="h-5 w-5" />
            <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-accent" />
          </span>
          <span className="tracking-tight">Camp<span className="text-primary">Flow</span></span>
        </NavLink>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground md:flex">
          <NavLink to="/campgrounds" className={navLinkClass}>
            Campgrounds
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
          <NavLink to="/activities" className={navLinkClass}>
            Activities
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
          <NavLink to="/faq" className={navLinkClass}>
            FAQ
          </NavLink>
          {isAuthenticated && user?.role === 'customer' && (
            <NavLink to="/dashboard" className={navLinkClass}>
              My Trips
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? <>
            <Button asChild variant="outline" size="sm"><Link to={user?.role === 'customer' ? '/dashboard/profile' : '/dashboard'}>My account</Link></Button>
            <Button variant="default" size="sm" onClick={() => void signOut()}>Sign out</Button>
          </> : <>
            <Button asChild variant="outline" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild variant="default" size="sm"><Link to="/register">Get started</Link></Button>
          </>}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1 text-sm font-medium text-foreground">
                <NavLink to="/campgrounds" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Campgrounds
                </NavLink>
                <NavLink to="/pricing" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Pricing
                </NavLink>
                <NavLink to="/activities" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Activities
                </NavLink>
                <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  About
                </NavLink>
                <NavLink to="/contact" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Contact
                </NavLink>
                <NavLink to="/faq" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  FAQ
                </NavLink>
                {isAuthenticated && user?.role === 'customer' && (
                  <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                    My Trips
                  </NavLink>
                )}
              </nav>
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="outline" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link to={user?.role === 'customer' ? '/dashboard/profile' : '/dashboard'}>My account</Link>
                    </Button>
                    <Button variant="default" size="sm" onClick={() => void signOut()}>Sign out</Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button asChild variant="default" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link to="/register">Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
