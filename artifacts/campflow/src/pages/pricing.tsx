import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listPricingRules, apiError, type ApiItem } from '@/services/customerDashboardService';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const samplePrices = [
  { type: 'Tent site', regular: '$42', weekend: '$52', holiday: '$62', note: 'Up to 4 guests' },
  { type: 'RV site', regular: '$58', weekend: '$72', holiday: '$86', note: 'Water & electric included' },
  { type: 'Cabin', regular: '$128', weekend: '$154', holiday: '$184', note: 'Sleeps up to 4' },
  { type: 'Glamping tent', regular: '$149', weekend: '$179', holiday: '$209', note: 'Furnished canvas stay' },
];

const detailsByType: Record<string, string> = {
  'Tent site': 'Up to 4 guests',
  'RV site': 'Water & electric included',
  Cabin: 'Sleeps up to 4',
  'Glamping tent': 'Furnished canvas stay',
};

const currency = (value: unknown) => (value == null ? '—' : `$${Number(value).toFixed(0)}`);

const siteTypeOf = (name: unknown) => String(name ?? '').split(' — ')[0].trim();

const tierOf = (rule: ApiItem): 'regular' | 'weekend' | 'holiday' =>
  rule.type === 'holiday' ? 'holiday' : rule.type === 'weekend' ? 'weekend' : 'regular';

const groupLiveRules = (rules: ApiItem[]) => {
  const byType: Record<string, { regular?: number; weekend?: number; holiday?: number }> = {};
  for (const rule of rules) {
    const type = siteTypeOf(rule.name);
    if (!type) continue;
    byType[type] ??= {};
    byType[type][tierOf(rule)] = Number(rule.flatRate);
  }
  return Object.entries(byType).map(([type, tiers]) => ({
    type,
    regular: currency(tiers.regular),
    weekend: currency(tiers.weekend),
    holiday: currency(tiers.holiday),
    note: detailsByType[type] ?? '',
  }));
};

const seasonTiers = [
  {
    eyebrow: 'Regular season',
    title: 'Sun through Thu',
    body: 'Most nights of the year fall into our regular season — the friendliest base rates across every site type.',
  },
  {
    eyebrow: 'Weekend season',
    title: 'Fri & Sat stays',
    body: 'Friday and Saturday reservations are priced higher to reflect demand, with adjustments set by each campground.',
    accent: true,
  },
  {
    eyebrow: 'Holiday season',
    title: 'Peak windows',
    body: 'Holiday weekends and the busiest travel windows carry their own rates, published well in advance.',
  },
];

const goodToKnow = [
  'Rates are shown per night, before taxes and optional add-ons.',
  'A two-night minimum may apply on holiday weekends.',
  'Each campground has a small number of premium waterfront or view sites.',
  'Ask the camping team about group and extended-stay rates.',
];

export default function Pricing() {
  usePageMetadata(
    'Pricing — CampFlow',
    'View current CampFlow pricing rules for seasonal, weekend, holiday, and promotional rates.'
  );
  const [pricing, setPricing] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listPricingRules({ page: 1, limit: 50, isActive: true })
      .then((result) => setPricing(result.data))
      .catch((caught) => setError(apiError(caught, 'Could not load live pricing.')))
      .finally(() => setLoading(false));
  }, []);

  const groupedRows = groupLiveRules(pricing);
  const rows = !loading && !error && groupedRows.length > 0 ? groupedRows : samplePrices;

  return (
    <div className="container-page space-y-24 pb-24">
      <section className="grid items-end gap-10 border-b border-border/70 pb-12 md:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="eyebrow">Straightforward rates</p>
          <h1 className="display-1 mt-5 max-w-3xl">Make a little room in the budget for adventure.</h1>
        </div>
        <p className="lede md:pb-2">
          {error
            ? 'Sample nightly rates for Green Valley stays. Exact pricing varies by campground, date, and site location.'
            : 'Here are the live pricing rules that affect your stay — including season, weekend and promotional adjustments, all managed by the campground team.'}
        </p>
      </section>

      <section>
        <header className="mb-6 flex items-baseline justify-between gap-6">
          <p className="eyebrow">The rate sheet</p>
          <p className="text-xs text-muted-foreground">All prices per night, USD</p>
        </header>
        <div className="editorial-figure border border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-secondary/40">
                <tr>
                  {['Stay type', 'Regular', 'Weekend', 'Holiday', 'Notes'].map((head, i) => (
                    <th
                      key={head}
                      className={`px-6 py-4 ${i === 0 ? '' : 'text-right'} font-normal`}
                    >
                      <span className="eyebrow text-foreground/70">{head}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((price, index) => (
                  <tr
                    key={price.type}
                    className={index === 0 ? '' : 'border-t border-border/50'}
                  >
                    <td className="px-6 py-6">
                      <p className="font-serif text-xl text-foreground">{price.type}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="font-serif text-2xl tabular-nums text-foreground">
                        {price.regular}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">/night</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="font-serif text-2xl tabular-nums text-foreground">
                        {price.weekend}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">/night</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="font-serif text-2xl tabular-nums text-foreground">
                        {price.holiday}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">/night</span>
                    </td>
                    <td className="px-6 py-6 text-sm leading-6 text-muted-foreground">
                      {price.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {loading && (
          <p className="mt-4 text-sm italic text-muted-foreground">
            Pulling the latest rates from your campgrounds…
          </p>
        )}
        {error && (
          <p className="mt-4 border-l-2 border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-10">
        <header className="max-w-2xl">
          <p className="eyebrow">How seasons work</p>
          <h2 className="display-2 mt-3">The calendar behind the rate.</h2>
        </header>
        <div className="grid gap-px bg-border/60 md:grid-cols-3">
          {seasonTiers.map(({ eyebrow, title, body, accent }) => (
            <article
              key={eyebrow}
              className={`flex flex-col gap-4 p-8 lg:p-10 ${
                accent ? 'bg-accent text-accent-foreground' : 'bg-card text-foreground'
              }`}
            >
              <p
                className={`eyebrow ${
                  accent ? 'text-accent-foreground/80' : 'text-foreground/70'
                }`}
              >
                {eyebrow}
              </p>
              <h3 className="font-serif text-2xl leading-tight">{title}</h3>
              <p
                className={`text-sm leading-6 ${
                  accent ? 'text-accent-foreground/85' : 'text-muted-foreground'
                }`}
              >
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-12 border-t border-border/70 pt-14 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">Good to know</p>
          <h2 className="display-2 mt-3">A few details that make planning easier.</h2>
          <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {goodToKnow.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-b border-border/60 pb-4 text-sm leading-6 text-foreground/85"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="flex flex-col justify-between gap-8 bg-primary p-8 text-primary-foreground lg:p-10">
          <div className="space-y-4">
            <p className="eyebrow text-accent">Plan your stay</p>
            <h3 className="display-3">Ready to lock in the dates?</h3>
            <p className="lede text-primary-foreground/85">
              Compare campgrounds, see what is available, and confirm your reservation in a few steps.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/campgrounds">
                Browse campgrounds <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/contact">Ask the team</Link>
            </Button>
          </div>
        </aside>
      </section>
    </div>
  );
}