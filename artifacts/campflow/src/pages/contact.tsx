import { useState, type FormEvent } from 'react';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContact, apiError } from '@/services/customerDashboardService';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { contactInfo } from '@/config/contact';

export default function Contact() {
  usePageMetadata(
    'Contact — CampFlow',
    'Reach out to the Green Valley camping team with questions about reservations, groups, and locations.',
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim() || undefined,
      topic: String(formData.get('topic') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
    };

    try {
      await createContact(payload);
      setSent(true);
      form.reset();
    } catch (caught) {
      setError(apiError(caught, 'We could not send your message.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page space-y-20 pb-12 pt-12 md:space-y-24 md:pt-16">
      <section className="max-w-3xl">
        <p className="eyebrow">Contact us</p>
        <h1 className="display-1 mt-5">Let&rsquo;s plan your time outside.</h1>
        <p className="lede mt-7 max-w-2xl">
          Questions about a stay, a group trip, or one of our locations? The camping
          team reads every message and usually replies within one business day.
        </p>
      </section>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <aside className="space-y-10">
          <div className="grid gap-px bg-border">
            {[
              {
                icon: Phone,
                label: 'Call us',
                detail: contactInfo.phone,
                note: 'Daily, 8 a.m.&ndash;7 p.m. local time',
              },
              {
                icon: Mail,
                label: 'Email us',
                detail: contactInfo.email,
                note: 'We usually reply within one business day',
              },
              {
                icon: MapPin,
                label: 'Visit us',
                detail: contactInfo.address,
                note: 'Pine Ridge &middot; Lake Haven &middot; Bluewater &middot; Cedar Creek',
              },
              {
                icon: Clock3,
                label: 'Campground hours',
                detail: 'Open year-round',
                note: 'Seasonal amenities vary by location',
              },
            ].map(({ icon: Icon, label, detail, note }) => (
              <div key={label} className="flex gap-5 bg-card p-6 md:p-7">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="eyebrow">{label}</p>
                  <p className="mt-3 font-serif text-lg leading-snug text-foreground">
                    {detail}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p>
                </div>
              </div>
            ))}
          </div>

          <figure className="editorial-figure aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1487730116645-74489c95b41b?auto=format&fit=crop&w=1200&q=85"
              alt="Campfire glowing in the evening at a wooded campground"
              className="h-full w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-5 text-primary-foreground">
              <p className="eyebrow !text-primary-foreground/85">The welcome desk</p>
              <p className="mt-1 font-serif text-base leading-snug">
                A real person will pick up.
              </p>
            </figcaption>
          </figure>
        </aside>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-3 px-6 pt-8 md:px-10 md:pt-10">
            <p className="eyebrow">Send a message</p>
            <CardTitle className="display-3 !text-3xl md:!text-4xl">
              Tell us about your trip.
            </CardTitle>
            <p className="lede">
              We&rsquo;ll come back with the right person, the right property, and
              the right questions to ask next.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8 md:px-10 md:pb-10">
            {sent ? (
              <div className="rounded-[2px] bg-secondary p-6 md:p-8">
                <p className="eyebrow !text-primary">Message received</p>
                <h2 className="mt-3 font-serif text-2xl leading-snug text-foreground md:text-3xl">
                  Thanks for reaching out.
                </h2>
                <p className="lede mt-4">
                  This demo form is not connected to an inbox yet, but the Green Valley
                  team would normally follow up within one business day.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={submit}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="topic">What can we help with?</Label>
                    <Input
                      id="topic"
                      name="topic"
                      required
                      placeholder="Reservations, group stays, accessibility..."
                    />
                  </div>
                  <p className="hidden text-xs uppercase tracking-[0.16em] text-muted-foreground sm:block">
                    &mdash;
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Tell us a little about your trip."
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs leading-5 text-muted-foreground">
                    We answer messages in the order they arrive, every weekday.
                  </p>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Sending…' : 'Send message'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}