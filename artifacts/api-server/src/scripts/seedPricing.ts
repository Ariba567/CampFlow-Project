import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Pricing from "../models/Pricing";
import Campground from "../models/Campground";

/**
 * Pricing rule tiers matching the public Pricing page's samplePrices fallback.
 * Each site type has a regular (seasonal), weekend, and holiday flat rate.
 */
const pricingTiers = [
  { key: "tent", siteType: "Tent site", regular: 42, weekend: 52, holiday: 62 },
  { key: "rv", siteType: "RV site", regular: 58, weekend: 72, holiday: 86 },
  { key: "cabin", siteType: "Cabin", regular: 128, weekend: 154, holiday: 184 },
  { key: "glamping", siteType: "Glamping tent", regular: 149, weekend: 179, holiday: 209 },
] as const;

// Derive the machine siteType key from a seeded rule's human-readable name.
// e.g. "Cabin — Regular rate" → "cabin".
const SITE_TYPE_BY_NAME_PATTERN = [
  { pattern: /^Tent site/i, key: "tent" },
  { pattern: /^RV site/i, key: "rv" },
  { pattern: /^Cabin/i, key: "cabin" },
  { pattern: /^Glamping tent/i, key: "glamping" },
] as const;

// Broad date window so the rules are active for the current demo period.
const START_DATE = new Date("2024-01-01");
const END_DATE = new Date("2030-12-31");

type RuleType = "seasonal" | "weekend" | "holiday";

function buildRules(campgroundId: mongoose.Types.ObjectId) {
  const rules: Array<{
    name: string;
    campground: mongoose.Types.ObjectId;
    siteType: "tent" | "rv" | "cabin" | "glamping";
    type: RuleType;
    applyMode: "flat_rate";
    flatRate: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    description?: string;
  }> = [];

  for (const tier of pricingTiers) {
    const entries: Array<{ tier: keyof Pick<typeof tier, "regular" | "weekend" | "holiday">; type: RuleType; label: string }> = [
      { tier: "regular", type: "seasonal", label: "Regular" },
      { tier: "weekend", type: "weekend", label: "Weekend" },
      { tier: "holiday", type: "holiday", label: "Holiday" },
    ];

    for (const entry of entries) {
      rules.push({
        name: `${tier.siteType} — ${entry.label} rate`,
        campground: campgroundId,
        siteType: tier.key,
        type: entry.type,
        applyMode: "flat_rate",
        flatRate: tier[entry.tier],
        startDate: START_DATE,
        endDate: END_DATE,
        isActive: true,
        description: `Flat ${entry.label.toLowerCase()} rate of $${tier[entry.tier]} per night for ${tier.siteType.toLowerCase()} stays.`,
      });
    }
  }

  return rules;
}

// Derive a machine siteType key from an existing rule's name for backfilling.
function siteTypeFromName(name: string): string | null {
  for (const { pattern, key } of SITE_TYPE_BY_NAME_PATTERN) {
    if (pattern.test(name)) return key;
  }
  return null;
}

// Backfill `siteType` on any existing rules that predate the schema field.
async function backfillSiteType(): Promise<number> {
  const rules = await Pricing.find({ siteType: { $exists: false } }).select("name").lean();
  let updated = 0;

  for (const rule of rules) {
    const siteType = siteTypeFromName(rule.name);
    if (!siteType) {
      console.warn(`  Could not infer siteType for rule "${rule.name}" — skipping.`);
      continue;
    }
    await Pricing.updateOne({ _id: rule._id }, { $set: { siteType } });
    updated += 1;
  }

  return updated;
}

async function seedPricingRules() {
  await connectDB();

  const backfilled = await backfillSiteType();
  if (backfilled > 0) {
    console.log(`Backfilled siteType on ${backfilled} existing pricing rule(s).`);
  }

  const campgrounds = await Campground.find({}).select("_id name").lean();
  if (campgrounds.length === 0) {
    console.error(
      "No campground found. Run the campground seeding step first (it runs automatically on first backend start against an empty DB).",
    );
    process.exitCode = 1;
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const campground of campgrounds) {
    const rules = buildRules(campground._id as mongoose.Types.ObjectId);
    let inserted = 0;
    let skipped = 0;

    for (const rule of rules) {
      const result = await Pricing.updateOne(
        { name: rule.name, campground: campground._id, siteType: rule.siteType },
        { $setOnInsert: rule },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    }

    totalInserted += inserted;
    totalSkipped += skipped;

    console.log(
      `Pricing seeding complete for "${campground.name}": created ${inserted}, already present (skipped) ${skipped}.`,
    );
  }

  console.log(
    `Pricing seeding complete across ${campgrounds.length} campgrounds: created ${totalInserted}, already present (skipped) ${totalSkipped}. Total rules = ${campgrounds.length * 12}.`,
  );
}

seedPricingRules()
  .catch((error: unknown) => {
    console.error("Failed to seed pricing rules:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
