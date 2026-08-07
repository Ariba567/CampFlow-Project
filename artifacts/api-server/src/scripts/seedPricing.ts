import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Pricing from "../models/Pricing";
import Campground from "../models/Campground";

/**
 * Pricing rule tiers matching the public Pricing page's samplePrices fallback.
 * Each site type has a regular (seasonal), weekend, and holiday flat rate.
 */
const pricingTiers = [
  { siteType: "Tent site", regular: 42, weekend: 52, holiday: 62 },
  { siteType: "RV site", regular: 58, weekend: 72, holiday: 86 },
  { siteType: "Cabin", regular: 128, weekend: 154, holiday: 184 },
  { siteType: "Glamping tent", regular: 149, weekend: 179, holiday: 209 },
] as const;

// Broad date window so the rules are active for the current demo period.
const START_DATE = new Date("2024-01-01");
const END_DATE = new Date("2026-12-31");

type RuleType = "seasonal" | "weekend" | "holiday";

function buildRules(campgroundId: mongoose.Types.ObjectId) {
  const rules: Array<{
    name: string;
    campground: mongoose.Types.ObjectId;
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

async function seedPricingRules() {
  await connectDB();

  const campground = await Campground.findOne().select("_id name").lean();
  if (!campground) {
    console.error(
      "No campground found. Run the campground seeding step first (it runs automatically on first backend start against an empty DB).",
    );
    process.exitCode = 1;
    return;
  }

  const rules = buildRules(campground._id as mongoose.Types.ObjectId);
  let inserted = 0;
  let skipped = 0;

  for (const rule of rules) {
    const result = await Pricing.updateOne(
      { name: rule.name },
      { $setOnInsert: rule },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(
    `Pricing seeding complete for "${campground.name}": created ${inserted}, already present (skipped) ${skipped}.`,
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
