import { Link } from 'react-router-dom';
import { Heart, Leaf, ShieldCheck, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const values = [
  { title: 'Nature first', body: 'We care for the trails, trees, and waterways that make every stay special.', icon: Leaf },
  { title: 'Genuinely welcoming', body: 'Helpful hosts, clean spaces, and the little details that help everyone settle in.', icon: Heart },
  { title: 'Comfort outside', body: 'Thoughtful amenities that make getting outdoors feel easy, safe, and restorative.', icon: ShieldCheck },
];

export default function About() {
  usePageMetadata('About — CampFlow', 'Learn how Green Valley campgrounds make outdoor stays easier, more comfortable, and more memorable.');
  return (
    <div className="space-y-20 pb-10 md:space-y-28">
      <section className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Our story</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">The good kind of getaway.</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">Green Valley began with one family campground and a belief that time outside should feel easier to find. Today, our four locations are places for first campfires, annual traditions, and unhurried weekends.</p>
          <p className="mt-4 leading-7 text-muted-foreground">We pair the character of each landscape with warm, straightforward hospitality—so you can spend less time figuring things out and more time being there.</p>
          <Button asChild className="mt-8"><Link to="/campgrounds">Find your Green Valley</Link></Button>
        </div>
        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85" alt="Mountain valley at sunrise" className="h-96 w-full rounded-3xl object-cover shadow-lg md:h-[34rem]" />
      </section>

      <section className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12 md:py-16">
        <Trees className="h-8 w-8 text-accent" />
        <blockquote className="mt-6 max-w-4xl font-serif text-3xl leading-tight md:text-5xl">“We’re here to make the outdoors feel like it belongs to everyone.”</blockquote>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">Mara Ellis, founder</p>
      </section>

      <section>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">What guides us</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Leave with more than you came with.</h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {values.map(({ title, body, icon: Icon }) => <Card key={title}><CardContent className="p-6"><Icon className="h-6 w-6 text-accent" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{body}</p></CardContent></Card>)}
        </div>
      </section>
    </div>
  );
}
