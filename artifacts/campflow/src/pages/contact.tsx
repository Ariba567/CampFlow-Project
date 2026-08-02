import { useState, type FormEvent } from 'react';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContact, apiError } from '@/services/customerDashboardService';

export default function Contact() {
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
    <div className="space-y-12 pb-10 md:space-y-16">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Contact us</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Let’s plan your time outside.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Questions about a stay, a group trip, or one of our locations? Our camping team is happy to help.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[{ icon: Phone, title: 'Call us', detail: '(800) 555-0148', note: 'Daily, 8 a.m.–7 p.m. local time' }, { icon: Mail, title: 'Email us', detail: 'hello@greenvalley.example', note: 'We usually reply within one business day' }, { icon: MapPin, title: 'Visit us', detail: 'Four locations across the U.S.', note: 'Pine Ridge · Lake Haven · Bluewater · Cedar Creek' }, { icon: Clock3, title: 'Campground hours', detail: 'Open year-round', note: 'Seasonal amenities vary by location' }].map(({ icon: Icon, title, detail, note }) => <Card key={title}><CardContent className="flex gap-4 p-5"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-foreground">{detail}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{note}</p></div></CardContent></Card>)}
        </div>
        <Card>
          <CardHeader><CardTitle className="font-serif text-3xl">Send a message</CardTitle></CardHeader>
          <CardContent>
            {sent ? <div className="rounded-xl bg-secondary p-6"><h2 className="text-lg font-semibold text-primary">Thanks for reaching out.</h2><p className="mt-2 leading-7 text-muted-foreground">This demo form is not connected to an inbox yet, but the Green Valley team would normally follow up within one business day.</p><Button variant="outline" className="mt-5" onClick={() => setSent(false)}>Send another message</Button></div> : <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="Your name" /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required placeholder="you@example.com" /></div></div>
              <div className="space-y-2"><Label htmlFor="topic">What can we help with?</Label><Input id="topic" name="topic" required placeholder="Reservations, group stays, accessibility..." /></div>
              <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={6} placeholder="Tell us a little about your trip." /></div>
              <Button type="submit">Send message</Button>
            </form>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
