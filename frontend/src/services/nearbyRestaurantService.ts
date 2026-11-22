
const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000";

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
}

// Request nearby restaurants from the backend.
export async function getNearbyRestaurants(
  latitude: number,
  longitude: number,
  radiusKm: number,
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
    if (response.status === 429) {
      throw new Error("rate_limited");
    }

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
