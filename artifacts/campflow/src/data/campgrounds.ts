export type SiteType = 'rv' | 'tent' | 'cabin' | 'glamping';

export interface CampgroundData {
  slug: string;
  name: string;
  location: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  amenities: string[];
  siteTypes: SiteType[];
  totalSites: number;
}

export const siteCategories: Record<SiteType, { name: string; description: string; image: string }> = {
  rv: { name: 'RV camping', description: 'Spacious sites with easy access, hookups, and room to settle in.', image: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=900&q=85' },
  tent: { name: 'Tent sites', description: 'Peaceful, shaded sites for sleeping close to the sounds of nature.', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=85' },
  cabin: { name: 'Cabins', description: 'Cozy, practical cabins for a comfortable basecamp in every season.', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=85' },
  glamping: { name: 'Glamping tents', description: 'Canvas stays with thoughtful comforts and a little extra magic.', image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=900&q=85' },
};

export const campgrounds: CampgroundData[] = [
  {
    slug: 'pine-ridge', name: 'Pine Ridge', location: 'Pine Ridge, Colorado', totalSites: 86,
    shortDescription: 'High-country camping beneath ponderosa pines, with trails right from camp.',
    description: 'Pine Ridge is our mountain escape: crisp mornings, big-sky sunsets, and a network of family-friendly trails steps from your site. Choose from full-hookup RV sites, secluded tent pads, cabins, and canvas glamping tents.',
    image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85',
    gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=85'],
    amenities: ['Full hookups', 'Trail access', 'Camp store', 'Clean bathhouses', 'Fire rings', 'Wi-Fi at lodge'], siteTypes: ['rv', 'tent', 'cabin', 'glamping'],
  },
  {
    slug: 'lake-haven', name: 'Lake Haven', location: 'Lake Haven, Michigan', totalSites: 64,
    shortDescription: 'Easy lakeside days, paddle launches, and long evenings by the water.',
    description: 'Lake Haven brings together calm water, shady sites, and a little room to slow down. Start with a swim, explore by kayak, then gather around the fire as the lake settles into evening.',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1200&q=85'],
    amenities: ['Lake access', 'Kayak launch', 'Fishing dock', 'Camp store', 'Bathhouses', 'Playground'], siteTypes: ['rv', 'tent', 'cabin'],
  },
  {
    slug: 'bluewater', name: 'Bluewater', location: 'Bluewater, Oregon', totalSites: 52,
    shortDescription: 'A quiet river valley with riverside tent sites and polished glamping stays.',
    description: 'Bluewater is made for unhurried river days. The campground follows a bend in the water, with tent sites near the trees, roomy RV pads, and furnished tents for a soft landing outdoors.',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85',
    gallery: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=1200&q=85'],
    amenities: ['River access', 'Paddle rentals', 'Picnic grove', 'Firewood kiosk', 'Bathhouses', 'Nature programs'], siteTypes: ['rv', 'tent', 'glamping'],
  },
  {
    slug: 'cedar-creek', name: 'Cedar Creek', location: 'Cedar Creek, Tennessee', totalSites: 74,
    shortDescription: 'A wooded family retreat with creekside cabins and wide-open play spaces.',
    description: 'Cedar Creek is our easygoing home base for family adventures. Spend the day on the creek, join a ranger walk, or settle into a cabin surrounded by tall cedar and a whole lot of quiet.',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=85',
    gallery: ['https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1455763916899-e8b50eca9967?auto=format&fit=crop&w=1200&q=85'],
    amenities: ['Creek access', 'Family rec field', 'Cabin village', 'Camp store', 'Bathhouses', 'Weekend activities'], siteTypes: ['rv', 'tent', 'cabin', 'glamping'],
  },
];

export const mapSites = [
  { id: 'A1', type: 'rv' as SiteType, status: 'available' as const, x: 16, y: 24 }, { id: 'A2', type: 'rv' as SiteType, status: 'occupied' as const, x: 34, y: 24 },
  { id: 'A3', type: 'rv' as SiteType, status: 'available' as const, x: 52, y: 24 }, { id: 'T4', type: 'tent' as SiteType, status: 'available' as const, x: 21, y: 51 },
  { id: 'T5', type: 'tent' as SiteType, status: 'occupied' as const, x: 41, y: 54 }, { id: 'T6', type: 'tent' as SiteType, status: 'available' as const, x: 62, y: 49 },
  { id: 'C7', type: 'cabin' as SiteType, status: 'available' as const, x: 77, y: 32 }, { id: 'G8', type: 'glamping' as SiteType, status: 'available' as const, x: 76, y: 66 },
  { id: 'G9', type: 'glamping' as SiteType, status: 'occupied' as const, x: 52, y: 76 }, { id: 'C10', type: 'cabin' as SiteType, status: 'available' as const, x: 27, y: 76 },
];
