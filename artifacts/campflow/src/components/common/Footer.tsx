import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/90 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
        <p>Crafted for outdoor stays with every detail in mind.</p>
        <div className="flex items-center gap-2 text-foreground/70">
          <Heart className="h-4 w-4 text-accent" />
          <span>CampFlow</span>
        </div>
      </div>
    </footer>
  );
}
