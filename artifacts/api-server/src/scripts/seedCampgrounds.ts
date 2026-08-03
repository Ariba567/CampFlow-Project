import { randomUUID } from "node:crypto";
import Campground from "../models/Campground";
import Campsite from "../models/Campsite";
import User from "../models/User";
import { hashPassword } from "../utils/password";

type SiteType = "rv" | "tent" | "cabin" | "glamping";

type SeedSite = {
  name: string;
  siteNumber: string;
  type: SiteType;
  basePrice: number;
  weekendPrice: number;
  maxGuests: number;
  maxRvLength?: number;
  maxTents?: number;
  features: string[];
};

type SeedCampground = {
  name: string;
  description: string;
  shortDescription: string;
  coordinates: [number, number];
  address: { street: string; city: string; state: string; zip: string; country: string };
  phone: string;
  email: string;
  categories: SiteType[];
  amenities: string[];
  tags: string[];
  petPolicy: "allowed" | "restricted" | "not_allowed";
  isFeatured: boolean;
  sites: SeedSite[];
};

const campgroundImage = "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85";
const siteImages: Record<SiteType, string> = {
  rv: "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=900&q=85",
  tent: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=85",
  cabin: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=85",
  glamping: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=900&q=85",
};

const sampleCampgrounds: SeedCampground[] = [
  {
    name: "Green Valley Blue Ridge",
    description: "A mountain retreat outside Asheville with ridge-line views, cool forest mornings, and welcoming sites for every kind of camping trip.",
    shortDescription: "Mountain camping with ridge views, forest trails, and welcoming stays.",
    coordinates: [-82.5515, 35.5951],
    address: { street: "181 Blue Ridge Parkway", city: "Asheville", state: "NC", zip: "28805", country: "US" },
    phone: "(828) 555-0148",
    email: "blueridge@greenvalleycampgrounds.com",
    categories: ["rv", "tent", "cabin", "glamping"],
    amenities: ["Full hookups", "Trail access", "Camp store", "Bathhouses", "Fire rings", "Wi-Fi at lodge"],
    tags: ["mountain", "hiking", "family-friendly"],
    petPolicy: "restricted",
    isFeatured: true,
    sites: [
      { name: "Ridge View RV Site", siteNumber: "BR-RV-12", type: "rv", basePrice: 68, weekendPrice: 82, maxGuests: 6, maxRvLength: 40, features: ["Mountain view", "Pull-through", "Full hookups"] },
      { name: "Laurel Tent Site", siteNumber: "BR-T-04", type: "tent", basePrice: 42, weekendPrice: 52, maxGuests: 4, maxTents: 2, features: ["Shaded", "Walk-in", "Near trails"] },
      { name: "Overlook Cabin", siteNumber: "BR-C-02", type: "cabin", basePrice: 156, weekendPrice: 184, maxGuests: 4, features: ["Mountain view", "Private porch", "Accessible parking"] },
    ],
  },
  {
    name: "Green Valley Lakeside",
    description: "A peaceful northern Michigan shoreline retreat for paddle launches, fishing, and long golden-hour walks near Traverse City.",
    shortDescription: "Easy lake days, paddle launches, and comfortable camping near Traverse City.",
    coordinates: [-85.6206, 44.7631],
    address: { street: "420 Shoreline Drive", city: "Traverse City", state: "MI", zip: "49686", country: "US" },
    phone: "(231) 555-0164",
    email: "lakeside@greenvalleycampgrounds.com",
    categories: ["rv", "tent", "cabin"],
    amenities: ["Lake access", "Kayak launch", "Fishing dock", "Camp store", "Bathhouses", "Playground"],
    tags: ["lakeside", "paddling", "fishing"],
    petPolicy: "allowed",
    isFeatured: false,
    sites: [
      { name: "Harbor RV Site", siteNumber: "LH-RV-08", type: "rv", basePrice: 64, weekendPrice: 78, maxGuests: 6, maxRvLength: 36, features: ["Lake access", "Full hookups", "Near dock"] },
      { name: "Pine Shore Tent Site", siteNumber: "LH-T-16", type: "tent", basePrice: 45, weekendPrice: 55, maxGuests: 4, maxTents: 2, features: ["Lake breeze", "Shaded", "Near bathhouse"] },
      { name: "Birchwater Cabin", siteNumber: "LH-C-05", type: "cabin", basePrice: 168, weekendPrice: 198, maxGuests: 5, features: ["Lake view", "Screened porch", "Family-friendly"] },
    ],
  },
  {
    name: "Green Valley Canyon",
    description: "Red rock country sets the pace at Canyon, where sunrise hikes, dark skies, and sculpted sandstone are always close at hand.",
    shortDescription: "Red rock adventures, dark skies, and relaxed stays in Sedona canyon country.",
    coordinates: [-111.7609, 34.8697],
    address: { street: "77 Juniper Canyon Road", city: "Sedona", state: "AZ", zip: "86336", country: "US" },
    phone: "(928) 555-0177",
    email: "canyon@greenvalleycampgrounds.com",
    categories: ["rv", "tent", "glamping"],
    amenities: ["Trail shuttle stop", "Camp store", "Bathhouses", "Dark-sky viewing deck", "Fire rings", "Water fill station"],
    tags: ["canyon", "stargazing", "desert"],
    petPolicy: "restricted",
    isFeatured: true,
    sites: [
      { name: "Red Rock RV Pad", siteNumber: "CN-RV-03", type: "rv", basePrice: 72, weekendPrice: 88, maxGuests: 6, maxRvLength: 38, features: ["Red rock view", "Full hookups", "Level pad"] },
      { name: "Juniper Tent Site", siteNumber: "CN-T-11", type: "tent", basePrice: 48, weekendPrice: 58, maxGuests: 4, maxTents: 2, features: ["Dark sky", "Trail access", "Shaded afternoon"] },
      { name: "Sage Canvas Tent", siteNumber: "CN-G-01", type: "glamping", basePrice: 182, weekendPrice: 214, maxGuests: 2, features: ["Desert view", "Furnished", "Private deck"] },
    ],
  },
  {
    name: "Green Valley Redwoods",
    description: "A northern California forest retreat with towering redwoods, fern-lined paths, creekside moments, and easy access to the coast.",
    shortDescription: "Towering redwoods, fern-lined trails, and peaceful forest stays near Eureka.",
    coordinates: [-124.1637, 40.8021],
    address: { street: "960 Redwood Grove Lane", city: "Eureka", state: "CA", zip: "95503", country: "US" },
    phone: "(707) 555-0192",
    email: "redwoods@greenvalleycampgrounds.com",
    categories: ["rv", "tent", "cabin", "glamping"],
    amenities: ["Redwood trails", "Camp store", "Bathhouses", "Creek access", "Fire rings", "Community pavilion"],
    tags: ["forest", "redwoods", "coast"],
    petPolicy: "allowed",
    isFeatured: false,
    sites: [
      { name: "Grove RV Site", siteNumber: "RW-RV-14", type: "rv", basePrice: 70, weekendPrice: 86, maxGuests: 6, maxRvLength: 36, features: ["Forest setting", "Full hookups", "Near trail"] },
      { name: "Fern Hollow Cabin", siteNumber: "RW-C-07", type: "cabin", basePrice: 174, weekendPrice: 206, maxGuests: 4, features: ["Forest view", "Covered deck", "Near creek"] },
      { name: "Canopy Canvas Tent", siteNumber: "RW-G-03", type: "glamping", basePrice: 188, weekendPrice: 220, maxGuests: 2, features: ["Redwood canopy", "Furnished", "Private fire ring"] },
    ],
  },
];

async function findOrCreateSeedManager() {
  const existingManager = await User.findOne({ role: "manager" }).select("_id").exec();
  if (existingManager) return { manager: existingManager, created: false };

  const manager = await User.create({
    firstName: "Campground",
    lastName: "Seed Manager",
    email: "campground.seed@campflow.test",
    password: await hashPassword(randomUUID()),
    role: "manager",
    isActive: false,
  });
  return { manager, created: true };
}

export async function seedSampleCampgrounds(): Promise<{ seeded: boolean; campgroundCount: number; campsiteCount: number }> {
  if (await Campground.exists({})) {
    console.log("Sample campground seeding skipped: campgrounds already exist.");
    return { seeded: false, campgroundCount: 0, campsiteCount: 0 };
  }

  const { manager, created } = await findOrCreateSeedManager();
  if (created) console.log("Created dedicated inactive seed manager for campground ownership.");

  let campsiteCount = 0;
  for (const { sites, ...data } of sampleCampgrounds) {
    const campground = await Campground.create({
      ...data,
      location: { type: "Point", coordinates: data.coordinates },
      manager: manager._id,
      website: `https://greenvalleycampgrounds.com/${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      images: [campgroundImage],
      coverImage: campgroundImage,
      rating: { average: 0, count: 0 },
      operatingHours: { checkIn: "14:00", checkOut: "11:00", open: "08:00", close: "22:00" },
      rules: ["Quiet hours are 10 p.m. to 7 a.m.", "Please keep your campsite clean."],
      totalSites: sites.length,
    });

    await Campsite.insertMany(sites.map((site, index) => ({
      campground: campground._id,
      name: site.name,
      siteNumber: site.siteNumber,
      type: site.type,
      description: `${site.name} at ${data.name}.`,
      images: [siteImages[site.type]],
      capacity: { maxGuests: site.maxGuests, maxRvLength: site.maxRvLength, maxTents: site.maxTents },
      amenities: site.type === "rv" ? ["Water", "Electric", "Sewer", "Picnic table"] : ["Fire ring", "Picnic table", "Water nearby"],
      basePrice: site.basePrice,
      weekendPrice: site.weekendPrice,
      isActive: true,
      isAvailable: true,
      mapCoordinates: { x: 20 + (index % 3) * 30, y: 35 },
      features: site.features,
      rating: { average: 0, count: 0 },
    })));
    campsiteCount += sites.length;
  }

  console.log(`Sample campground seeding complete: created ${sampleCampgrounds.length} campgrounds and ${campsiteCount} campsites.`);
  return { seeded: true, campgroundCount: sampleCampgrounds.length, campsiteCount };
}
