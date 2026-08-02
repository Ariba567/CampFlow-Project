import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const questions = [
  ['When can I check in and check out?', 'RV and tent-site check-in begins at 2 p.m.; cabins and glamping tents are ready from 4 p.m. Check-out is 11 a.m. Please contact your campground if you need to arrange a different time.'],
  ['Are pets welcome?', 'Yes—well-behaved pets are welcome at most RV and tent sites. A few cabins are pet-friendly, too. Keep pets leashed, attended, and away from shared indoor amenities.'],
  ['Do you have full-hookup RV sites?', 'Many of our RV sites include water, electric, and sewer hookups. Available hookup types and site lengths are listed with each campground location.'],
  ['Can I make a group reservation?', 'Absolutely. For family reunions, scout trips, and other groups, contact our camping team with your dates, group size, and preferred location.'],
  ['What should I bring for a tent site?', 'Bring your tent, sleeping gear, lighting, weather-ready clothing, and camp kitchen basics. Each location page notes whether a site includes a picnic table, fire ring, or nearby water access.'],
  ['What happens if I need to cancel?', 'Cancellation policies vary by stay type and season. Your booking confirmation will show the exact terms; please contact us as soon as possible if plans change.'],
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
