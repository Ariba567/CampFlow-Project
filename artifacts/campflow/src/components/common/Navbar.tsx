import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative text-[0.95rem] font-medium tracking-[-0.005em] transition-colors duration-200',
    'after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-full after:origin-left after:bg-foreground after:transition-transform after:duration-300',
    isActive
      ? 'text-foreground after:scale-x-100'
      : 'text-foreground/70 hover:text-foreground after:scale-x-0 hover:after:scale-x-100',
  );

const NAV_ITEMS = [
  { to: '/campgrounds', label: 'Campgrounds' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/activities', label: 'Activities' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-5 py-4 md:px-8">
        <NavLink to="/" className="group flex items-center gap-2.5 text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20 transition-transform group-hover:rotate-[-4deg]">
            <Trees className="h-4 w-4" />
          </span>
          <span className="font-serif text-[1.15rem] font-medium tracking-[-0.02em]">
            Camp<span className="text-primary">Flow</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated && user?.role === 'customer' && (
            <NavLink to="/dashboard" className={navLinkClass}>
              My Trips
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-foreground/80 hover:text-foreground"
              >
                <Link to={user?.role === 'customer' ? '/dashboard/profile' : '/dashboard'}>
                  My account
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => void signOut()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-foreground/80 hover:text-foreground"
              >
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="mt-8 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Trees className="h-4 w-4" />
                </span>
                <span className="font-serif text-lg font-medium">
                  Camp<span className="text-primary">Flow</span>
                </span>
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'border-b border-border/60 py-3 text-base font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {isAuthenticated && user?.role === 'customer' && (
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-border/60 py-3 text-base font-medium text-foreground/70 hover:text-foreground"
                  >
                    My Trips
                  </NavLink>
                )}
              </nav>
              <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6">
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="outline" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link to={user?.role === 'customer' ? '/dashboard/profile' : '/dashboard'}>
                        My account
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => void signOut()}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" onClick={() => setMenuOpen(false)}>
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button asChild size="sm" onClick={() => setMenuOpen(false)}>
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