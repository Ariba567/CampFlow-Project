import { Facebook, Heart, Instagram, Mail, MapPin, Phone, Trees } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/55 text-sm text-muted-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <div className="flex items-center gap-2 text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Trees className="h-4 w-4" /></span>
            <span className="font-semibold tracking-tight">Camp<span className="text-primary">Flow</span></span>
          </div>
          <p className="mt-4 max-w-xs leading-6">Crafted for outdoor stays with every detail in mind.</p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Contact Green Valley</h2>
          <div className="mt-4 grid gap-3">
            <a href="tel:+18005550148" className="flex items-center gap-2 transition-colors hover:text-primary"><Phone className="h-4 w-4 text-accent" />(800) 555-0148</a>
            <a href="mailto:hello@greenvalleycampgrounds.com" className="flex items-center gap-2 transition-colors hover:text-primary"><Mail className="h-4 w-4 text-accent" />hello@greenvalleycampgrounds.com</a>
            <a href="https://maps.google.com/?q=245+Pine+Ridge+Road+Evergreen+CO+80439" className="flex items-start gap-2 transition-colors hover:text-primary"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />245 Pine Ridge Road, Evergreen, CO 80439</a>
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Follow along</p>
          <div className="mt-4 grid gap-3">
            <a href="https://instagram.com/greenvalleycampgrounds" aria-label="Green Valley Campgrounds on Instagram" className="flex items-center gap-2 transition-colors hover:text-primary"><Instagram className="h-4 w-4 text-accent" />@greenvalleycampgrounds</a>
            <a href="https://facebook.com/greenvalleycampgrounds" aria-label="Green Valley Campgrounds on Facebook" className="flex items-center gap-2 transition-colors hover:text-primary"><Facebook className="h-4 w-4 text-accent" />Green Valley Campgrounds</a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70"><div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-4 text-xs md:px-6"><Heart className="h-3.5 w-3.5 text-accent" />Made for memorable stays outdoors.</div></div>
    </footer>
  );
}
