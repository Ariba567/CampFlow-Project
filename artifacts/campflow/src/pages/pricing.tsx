import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { listPricingRules, apiError, type ApiItem } from '@/services/customerDashboardService';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const samplePrices = [
  { type: 'Tent site', regular: '$42', weekend: '$52', holiday: '$62', note: 'Up to 4 guests' },
  { type: 'RV site', regular: '$58', weekend: '$72', holiday: '$86', note: 'Water & electric included' },
  { type: 'Cabin', regular: '$128', weekend: '$154', holiday: '$184', note: 'Sleeps up to 4' },
  { type: 'Glamping tent', regular: '$149', weekend: '$179', holiday: '$209', note: 'Furnished canvas stay' },
];

export default function Pricing() {
  usePageMetadata('Pricing — CampFlow', 'View current CampFlow pricing rules for seasonal, weekend, holiday, and promotional rates.');
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

  return (
    <div className="space-y-12 pb-10 md:space-y-16">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Straightforward rates</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Make a little room in the budget for adventure.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {error
            ? 'Sample nightly rates for Green Valley stays. Exact pricing varies by campground, date, and site location.'
            : 'Here are the live pricing rules that affect your stay, including season, weekend and promotional adjustments.'}
        </p>
      </section>

      {!loading && !error && pricing.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-secondary/60 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">Pricing rule</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Adjustment</th>
                  <th className="px-6 py-4 font-semibold">Applies to</th>
                  <th className="px-6 py-4 font-semibold">Dates</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((rule) => (
                  <tr key={String(rule._id ?? rule.id)} className="border-t">
                    <td className="px-6 py-5 font-semibold">{rule.name}</td>
                    <td className="px-6 py-5 text-muted-foreground">{rule.type}</td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {rule.applyMode === 'flat_rate'
                        ? `$${rule.flatRate?.toFixed?.(2) ?? rule.flatRate ?? 0} ${rule.campsite ? 'per site' : 'flat'}`
                        : rule.applyMode === 'override'
                          ? `Override to $${rule.flatRate?.toFixed?.(2) ?? 0}`
                          : `${rule.multiplier ? `${rule.multiplier}x` : 'N/A'}`}
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {rule.campsite?.name ? `${rule.campsite.name} (${rule.campsite.siteNumber ?? ''})` : rule.campground?.name ?? 'All campgrounds'}
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{rule.startDate ? new Date(rule.startDate).toLocaleDateString() : '—'} – {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-secondary/60 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">Stay type</th>
                  <th className="px-6 py-4 font-semibold">Regular</th>
                  <th className="px-6 py-4 font-semibold">Weekend</th>
                  <th className="px-6 py-4 font-semibold">Holiday</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {samplePrices.map((price) => (
                  <tr key={price.type} className="border-t">
                    <td className="px-6 py-5 font-semibold">{price.type}</td>
                    <td className="px-6 py-5 text-muted-foreground">{price.regular}<span className="ml-1 text-xs">/night</span></td>
                    <td className="px-6 py-5 text-muted-foreground">{price.weekend}<span className="ml-1 text-xs">/night</span></td>
                    <td className="px-6 py-5 text-muted-foreground">{price.holiday}<span className="ml-1 text-xs">/night</span></td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{price.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <Badge>Regular season</Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Sunday through Thursday, outside peak holiday periods.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <Badge variant="secondary">Weekend season</Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Friday and Saturday stays may see higher demand pricing.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Badge variant="secondary">Holiday season</Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Special rates apply for holiday windows and peak travel dates.</p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl bg-primary p-8 text-primary-foreground">
        <Sparkles className="h-6 w-6 text-accent" />
        <h2 className="mt-4 font-serif text-3xl">Good to know</h2>
        <ul className="mt-5 grid gap-3 text-sm text-primary-foreground/85 md:grid-cols-2">
          {['Rates are shown per night, before taxes and optional add-ons.', 'A two-night minimum may apply on holiday weekends.', 'Each location has a small number of premium waterfront or view sites.', 'Ask our camping team about group and extended-stay rates.'].map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
