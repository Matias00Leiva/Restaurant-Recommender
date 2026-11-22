
const API_URL =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

// Price categories returned by Google Places.
export type GooglePriceLevel =
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE"
  | "PRICE_LEVEL_UNSPECIFIED";

// Structure of a real restaurant.
export interface NearbyRestaurant {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  mapsUrl: string;
  rating: number | null;
  ratingCount: number;

  // Google Places cuisine categories.
  types?: string[];

  // Google Places price category, when available.
  priceLevel?: GooglePriceLevel | null;
}

// Retrieve real restaurants from the FoodieFind backend.
export async function getNearbyRestaurants(
  latitude: number,
  longitude: number,
  radiusKm = 20,
): Promise<NearbyRestaurant[]> {
  const url = new URL(
    "/api/nearby-restaurants",
    API_URL,
  );

  url.searchParams.set(
    "latitude",
    String(latitude),
  );

  url.searchParams.set(
    "longitude",
    String(longitude),
  );

  url.searchParams.set(
    "radiusKm",
    String(radiusKm),
  );

  const response = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json()
      .catch(() => null) as {
        error?: string;
      } | null;

    // Daily Google Places quota exhausted.
    if (data?.error === "daily_quota_exceeded") {
      throw new Error("daily_quota_exceeded");
    }

    // Another request is already being processed.
    if (response.status === 429) {
      throw new Error("rate_limited");
    }

    // Google Places is not configured.
    if (response.status === 503) {
      throw new Error("not_configured");
    }

    throw new Error("nearby_failed");
  }

  const data = await response.json() as {
    restaurants: NearbyRestaurant[];
  };

  return data.restaurants;
}
