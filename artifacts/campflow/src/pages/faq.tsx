import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const questions = [
  ['How do I make a reservation?', 'Browse campgrounds, pick a site, choose your dates, and confirm your reservation online — no phone call needed. You\'ll get a confirmation once it\'s booked.'],
  ['What is your cancellation policy?', 'You can cancel or modify a reservation from your account dashboard. Refund eligibility depends on how close to your arrival date you cancel.'],
  ['Are pets allowed at your campgrounds?', 'Most of our sites are pet-friendly. Check the specific campground\'s amenities section before booking to confirm.'],
  ['What amenities are included with each site type?', 'RV sites include water and electric hookups. Cabins and glamping tents come furnished. Tent sites are shaded, basic sites close to nature. Full details are listed on each campground\'s page.'],
  ['Do I need to bring my own RV, or do you provide one?', 'Our RV sites are for guests bringing their own RV or trailer — we don\'t currently rent RVs. Cabins and glamping tents are fully set up and ready to use.'],
  ['Is Wi-Fi available at the campgrounds?', 'Availability varies by location. Check the specific campground\'s amenities list for details before your trip.'],
  ['What are your check-in and check-out times?', 'Standard check-in and check-out times are shown during the reservation process for each site.'],
  ['Do you offer discounts for longer stays or group bookings?', 'Seasonal and promotional pricing is set by each campground and shown on the Pricing page. For group trips, reach out through the Contact page.'],
];

export default function FAQ() {
  usePageMetadata('FAQ — CampFlow', 'Find answers to common questions about reservations, pets, check-in, and campground policies.');
  return (
    <div className="pb-10">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Helpful details</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Frequently asked questions</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">A few useful things to know before you head for Green Valley.</p>
      </section>
      <section className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="rounded-2xl border bg-card px-6 shadow-sm">
          {questions.map(([question, answer], index) => <AccordionItem key={question} value={`question-${index}`}><AccordionTrigger className="py-5 text-base">{question}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>
      <Card className="mx-auto mt-12 max-w-3xl bg-secondary/60"><CardContent className="flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold"><MessageCircle className="h-5 w-5 text-accent" />Still have a question?</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Our camping team can help with the details of your trip.</p></div><Button asChild variant="outline"><Link to="/contact">Contact us</Link></Button></CardContent></Card>
    </div>
  );
}
