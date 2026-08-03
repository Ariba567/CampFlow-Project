type CampgroundImageSource = {
  slug?: unknown;
  coverImage?: unknown;
  images?: unknown[];
  image?: unknown;
};

const themedCampgroundImages: Record<string, string> = {
  'green-valley-blue-ridge': 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85',
  'green-valley-lakeside': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=85',
  'green-valley-canyon': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
  'green-valley-redwoods': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
};

export function campgroundImage(campground: CampgroundImageSource): string | undefined {
  const fallback = campground.coverImage ?? campground.images?.[0] ?? campground.image;
  return themedCampgroundImages[String(campground.slug)] ?? (typeof fallback === 'string' ? fallback : undefined);
}
