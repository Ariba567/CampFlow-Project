import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
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
          <Button variant="outline" size="sm">Sign in</Button>
          <Button variant="default" size="sm">Get started</Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
