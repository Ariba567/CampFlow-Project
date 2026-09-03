import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Trees } from 'lucide-react';
import { contactInfo } from '@/config/contact';

const FOOTER_LINKS: Array<{ heading: string; items: Array<{ label: string; to: string }> }> = [
  {
    heading: 'Discover',
    items: [
      { label: 'Campgrounds', to: '/campgrounds' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Activities', to: '/activities' },
      { label: 'Gallery', to: '/gallery' },
    ],
  },
  {
    heading: 'Plan',
    items: [
      { label: 'Make a reservation', to: '/reservation' },
      { label: 'About CampFlow', to: '/about' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'My trips', to: '/dashboard' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Trees className="h-4 w-4" />
              </span>
              <span className="font-serif text-[1.15rem] font-medium tracking-[-0.02em]">
                Camp<span className="text-primary">Flow</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-7 text-muted-foreground">
              A small group of campgrounds in Colorado, Michigan, Oregon and Tennessee.
              Built for people who want to spend less time planning and more time outside.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://instagram.com/greenvalleycampgrounds"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-border/80 text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/greenvalleycampgrounds"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-border/80 text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_LINKS.map((column) => (
              <div key={column.heading}>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-foreground/50">
                  {column.heading}
                </p>
                <ul className="mt-5 space-y-3">
                  {column.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="text-[0.95rem] text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 border-t border-border/70 pt-8 md:grid-cols-3 md:gap-10">
          <a
            href={contactInfo.phoneHref}
            className="flex items-start gap-3 text-foreground/80 hover:text-foreground"
          >
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm leading-6">{contactInfo.phone}</span>
          </a>
          <a
            href={`mailto:${contactInfo.email}`}
            className="flex items-start gap-3 text-foreground/80 hover:text-foreground"
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm leading-6">{contactInfo.email}</span>
          </a>
          <a
            href={contactInfo.addressHref}
            className="flex items-start gap-3 text-foreground/80 hover:text-foreground"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm leading-6">{contactInfo.address}</span>
          </a>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} CampFlow · Green Valley Campgrounds</p>
          <p className="tracking-wide">Open year-round · Reservations recommended</p>
        </div>
      </div>
    </footer>
  );
}