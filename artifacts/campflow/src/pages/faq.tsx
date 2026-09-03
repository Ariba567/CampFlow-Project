import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const questions = [
  [
    'How do I make a reservation?',
    "Browse campgrounds, pick a site, choose your dates, and confirm your reservation online — no phone call needed. You'll get a confirmation once it's booked.",
  ],
  [
    'What is your cancellation policy?',
    'You can cancel or modify a reservation from your account dashboard. Refund eligibility depends on how close to your arrival date you cancel.',
  ],
  [
    "Are pets allowed at your campgrounds?",
    "Most of our sites are pet-friendly. Check the specific campground's amenities section before booking to confirm.",
  ],
  [
    'What amenities are included with each site type?',
    "RV sites include water and electric hookups. Cabins and glamping tents come furnished. Tent sites are shaded, basic sites close to nature. Full details are listed on each campground's page.",
  ],
  [
    'Do I need to bring my own RV, or do you provide one?',
    "Our RV sites are for guests bringing their own RV or trailer — we don't currently rent RVs. Cabins and glamping tents are fully set up and ready to use.",
  ],
  [
    'Is Wi-Fi available at the campgrounds?',
    "Availability varies by location. Check the specific campground's amenities list for details before your trip.",
  ],
  [
    'What are your check-in and check-out times?',
    'Standard check-in and check-out times are shown during the reservation process for each site.',
  ],
  [
    'Do you offer discounts for longer stays or group bookings?',
    'Seasonal and promotional pricing is set by each campground and shown on the Pricing page. For group trips, reach out through the Contact page.',
  ],
];

export default function FAQ() {
  usePageMetadata(
    'FAQ — CampFlow',
    'Find answers to common questions about reservations, pets, check-in, and campground policies.',
  );

  return (
    <div className="container-page pb-16 pt-12 md:pt-16">
      <section className="container-prose text-center">
        <p className="eyebrow">Helpful details</p>
        <h1 className="display-1 mt-5">Frequently asked questions.</h1>
        <p className="lede mt-7">
          A few useful things to know before you head for Green Valley. If your
          question isn&rsquo;t here, our camping team is only a message away.
        </p>
      </section>

      <section className="container-prose mt-14">
        <Accordion type="single" collapsible className="rounded-[2px] border border-border bg-card px-6 md:px-8">
          {questions.map(([question, answer], index) => (
            <AccordionItem key={question} value={`question-${index}`} className="border-border">
              <AccordionTrigger className="py-5 font-serif text-lg leading-snug md:text-xl">
                <span className="flex items-baseline gap-4">
                  <span className="font-serif text-sm text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 leading-7 text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="container-prose mt-14">
        <Card className="rounded-[2px] border-border bg-secondary">
          <CardContent className="flex flex-col items-start gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-accent" />
                <h2 className="font-serif text-2xl leading-snug">
                  Still have a question?
                </h2>
              </div>
              <p className="lede mt-3">
                Our camping team can help with the details of your trip &mdash;
                dates, dogs, dietary needs, and the things you didn&rsquo;t think
                to ask until after you read this.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact us</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}