
import { env } from "../config/env.ts";

const GOOGLE_PLACES_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

const MAX_RESULTS_PER_REQUEST = 20;

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: Coordinates;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
}

interface GoogleNearbyResponse {
  places?: GooglePlace[];
}

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

// Calculate the distance between two coordinates in kilometers.
export function calculateDistance(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const toRadians = (value: number) =>
    value * Math.PI / 180;

  const latDiff = toRadians(latitude2 - latitude1);
  const lonDiff = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(lonDiff / 2) ** 2;

  return 6371 * 2 *
    Math.asin(Math.min(1, Math.sqrt(a)));
}

// Move a search center by a given north/east distance.
function moveCenter(
  center: Coordinates,
  northKm: number,
  eastKm: number,
): Coordinates {
  const latitude = Math.max(
    -89.9,
    Math.min(89.9, center.latitude + northKm / 111.32),
  );

  const longitudeScale = 111.32 *
    Math.cos(center.latitude * Math.PI / 180);

  const rawLongitude = center.longitude +
    eastKm / Math.max(1, Math.abs(longitudeScale));

  const longitude = (
    (rawLongitude + 180) % 360 + 360
  ) % 360 - 180;

  return { latitude, longitude };
}

// Search one circular area using Google Places.
async function searchArea(
  center: Coordinates,
  radiusKm: number,
  fetcher: typeof fetch,
  apiKey: string,
): Promise<GooglePlace[]> {
  const response = await fetcher(GOOGLE_PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.googleMapsUri",
        "places.rating",
        "places.userRatingCount",
      ].join(","),
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: MAX_RESULTS_PER_REQUEST,
      rankPreference: "POPULARITY",
      languageCode: "es",
      locationRestriction: {
        circle: {
          center,
          radius: radiusKm * 1000,
        },
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(
      `Google Places request failed: ${response.status}`,
    );
  }

  const data =
    await response.json() as GoogleNearbyResponse;

  return data.places ?? [];
}

// Find restaurants across one or several search areas.
export async function searchNearbyRestaurants(
  latitude: number,
  longitude: number,
  fetcher: typeof fetch = fetch,
  apiKey = env.googlePlacesApiKey,
  radiusKm = 20,
): Promise<NearbyRestaurant[]> {
  if (!apiKey) {
    throw new Error("Google Places API key is missing");
  }

  if (
    !Number.isInteger(radiusKm) ||
    radiusKm < 1 ||
    radiusKm > 50
  ) {
    throw new Error("Invalid search radius");
  }

  const userLocation = { latitude, longitude };

  // Small radii use one request.
  // Larger radii explore five different sectors.
  const centers: Coordinates[] = [userLocation];

  if (radiusKm > 10) {
    const offsetKm = radiusKm * 0.55;

    centers.push(
      moveCenter(userLocation, offsetKm, 0),
      moveCenter(userLocation, -offsetKm, 0),
      moveCenter(userLocation, 0, offsetKm),
      moveCenter(userLocation, 0, -offsetKm),
    );
  }

  const areaRadiusKm = centers.length === 1
    ? radiusKm
    : radiusKm * 0.7;

  // Search sectors concurrently and keep successful responses.
  const responses = await Promise.allSettled(
    centers.map((center) =>
      searchArea(center, areaRadiusKm, fetcher, apiKey)
    ),
  );

  const successful = responses.filter(
    (result): result is PromiseFulfilledResult<GooglePlace[]> =>
      result.status === "fulfilled",
  );

  if (successful.length === 0) {
    throw new Error("All Google Places searches failed");
  }

  // Merge the results and remove repeated Place IDs.
  const uniquePlaces = new Map<string, GooglePlace>();

  for (const response of successful) {
    for (const place of response.value) {
      if (place.id) {
        uniquePlaces.set(place.id, place);
      }
    }
  }

  const restaurants: NearbyRestaurant[] = [];

  for (const place of uniquePlaces.values()) {
    if (
      !place.id ||
      !place.displayName?.text ||
      typeof place.location?.latitude !== "number" ||
      typeof place.location?.longitude !== "number"
    ) {
      continue;
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      place.location.latitude,
      place.location.longitude,
    );

    // Respect the user's radius, not each sector's radius.
    if (distance > radiusKm) {
      continue;
    }

    const mapsUrl = new URL(
      "https://www.google.com/maps/search/",
    );

    mapsUrl.searchParams.set("api", "1");
    mapsUrl.searchParams.set(
      "query",
      place.displayName.text,
    );
    mapsUrl.searchParams.set(
      "query_place_id",
      place.id,
    );

    restaurants.push({
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress ?? "",
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      distanceKm: Math.round(distance * 10) / 10,
      mapsUrl: place.googleMapsUri ??
        mapsUrl.toString(),
      rating: typeof place.rating === "number"
        ? place.rating
        : null,
      ratingCount:
        typeof place.userRatingCount === "number"
          ? place.userRatingCount
          : 0,
    });
  }

  return restaurants.sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}
