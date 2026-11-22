
import { env } from "../config/env.ts";

const GOOGLE_PLACES_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

const MAX_RESULTS_PER_REQUEST = 20;
const REQUEST_TIMEOUT_MS = 10000;

// Request the restaurant fields needed by FoodieFind.
const GOOGLE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.priceLevel",
].join(",");

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Google Places API response structure.
interface GooglePlace {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: Coordinates;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  priceLevel?: string;
}

interface GoogleNearbyResponse {
  places?: GooglePlace[];
}

// Restaurant structure returned to the frontend.
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
  types: string[];

  // Preserve Google's price category.
  priceLevel: string | null;
}

// Calculate distance using the Haversine formula.
export function calculateDistance(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const toRadians = (value: number) =>
    value * Math.PI / 180;

  const latitudeDifference = toRadians(
    latitude2 - latitude1,
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1,
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    6371 *
    2 *
    Math.asin(Math.min(1, Math.sqrt(a)))
  );
}

// Move a search center north or east.
function moveCenter(
  center: Coordinates,
  northKm: number,
  eastKm: number,
): Coordinates {
  const latitude = Math.max(
    -89.9,
    Math.min(
      89.9,
      center.latitude + northKm / 111.32,
    ),
  );

  const longitudeScale =
    111.32 *
    Math.cos(center.latitude * Math.PI / 180);

  const rawLongitude =
    center.longitude +
    eastKm / Math.max(1, Math.abs(longitudeScale));

  const longitude =
    ((rawLongitude + 180) % 360 + 360) % 360 - 180;

  return {
    latitude,
    longitude,
  };
}

// Read Google API errors without exposing the API key.
async function readGoogleError(
  response: Response,
  apiKey: string,
): Promise<string> {
  const raw = await response.text();

  let message = raw.slice(0, 1000);

  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        status?: string;
        message?: string;
      };
    };

    if (parsed.error) {
      message = [
        parsed.error.status,
        parsed.error.message,
      ]
        .filter(Boolean)
        .join(": ") || message;
    }
  } catch {
    // Use the original text when Google returns non-JSON data.
  }

  return message
    .replaceAll(apiKey, "[REDACTED]")
    .slice(0, 1000);
}

// Search one circular geographical area.
async function searchArea(
  center: Coordinates,
  radiusKm: number,
  fetcher: typeof fetch,
  apiKey: string,
): Promise<GooglePlace[]> {
  const response = await fetcher(
    GOOGLE_PLACES_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
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
      signal: AbortSignal.timeout(
        REQUEST_TIMEOUT_MS,
      ),
    },
  );

  if (!response.ok) {
    const details = await readGoogleError(
      response,
      apiKey,
    );

    throw new Error(
      `Google Places HTTP ${response.status}: ${details}`,
    );
  }

  const data =
    await response.json() as GoogleNearbyResponse;

  return Array.isArray(data.places)
    ? data.places
    : [];
}

// Search nearby restaurants using Google Places.
export async function searchNearbyRestaurants(
  latitude: number,
  longitude: number,
  fetcher: typeof fetch = fetch,
  apiKey = env.googlePlacesApiKey,
  radiusKm = 20,
): Promise<NearbyRestaurant[]> {
  // Validate Google API configuration.
  if (!apiKey) {
    throw new Error(
      "Google Places API key is missing",
    );
  }

  // Validate coordinates.
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid coordinates");
  }

  // Validate the selected radius.
  if (
    !Number.isInteger(radiusKm) ||
    radiusKm < 1 ||
    radiusKm > 50
  ) {
    throw new Error("Invalid search radius");
  }

  const userLocation: Coordinates = {
    latitude,
    longitude,
  };

  const centers: Coordinates[] = [
    userLocation,
  ];

  // Preserve the five-sector search for larger radii.
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

  // Execute sector searches independently.
  const responses = await Promise.allSettled(
    centers.map((center) =>
      searchArea(
        center,
        areaRadiusKm,
        fetcher,
        apiKey,
      )
    ),
  );

  // Log failed sectors for debugging.
  for (const [index, result] of responses.entries()) {
    if (result.status === "rejected") {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);

      console.error(
        `Google Places sector ${index + 1} failed:`,
        message,
      );
    }
  }

  // Keep successful Google responses.
  const successful = responses.filter(
    (
      result,
    ): result is PromiseFulfilledResult<
      GooglePlace[]
    > => result.status === "fulfilled",
  );

  // Detect daily quota errors when all sectors fail.
  if (successful.length === 0) {
    const dailyQuotaExceeded = responses.some(
      (result) => {
        if (result.status !== "rejected") {
          return false;
        }

        const message =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        return (
          message.includes("RESOURCE_EXHAUSTED") &&
          /per day|daily/i.test(message)
        );
      },
    );

    if (dailyQuotaExceeded) {
      throw new Error("daily_quota_exceeded");
    }

    throw new Error(
      "All Google Places searches failed",
    );
  }

  // Deduplicate restaurants using their Place IDs.
  const uniquePlaces =
    new Map<string, GooglePlace>();

  for (const response of successful) {
    for (const place of response.value) {
      if (place.id) {
        uniquePlaces.set(place.id, place);
      }
    }
  }

  const restaurants: NearbyRestaurant[] = [];

  // Convert Google data into FoodieFind restaurant objects.
  for (const place of uniquePlaces.values()) {
    if (
      !place.id ||
      !place.displayName?.text ||
      typeof place.location?.latitude !== "number" ||
      typeof place.location?.longitude !== "number"
    ) {
      continue;
    }

    // Calculate actual distance from the user.
    const distance = calculateDistance(
      latitude,
      longitude,
      place.location.latitude,
      place.location.longitude,
    );

    // Exclude restaurants outside the selected radius.
    if (distance > radiusKm) {
      continue;
    }

    // Generate a fallback Google Maps URL.
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

    // Extract cuisine categories.
    const types = Array.isArray(place.types)
      ? place.types.filter(
          (type): type is string =>
            typeof type === "string",
        )
      : [];

    // Preserve Google's price level when available.
    const priceLevel =
      typeof place.priceLevel === "string"
        ? place.priceLevel
        : null;

    restaurants.push({
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress ?? "",
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      distanceKm:
        Math.round(distance * 10) / 10,
      mapsUrl:
        place.googleMapsUri ??
        mapsUrl.toString(),
      rating:
        typeof place.rating === "number"
          ? place.rating
          : null,
      ratingCount:
        typeof place.userRatingCount === "number"
          ? place.userRatingCount
          : 0,
      types,

      // Required by the budget filter and its tests.
      priceLevel,
    });
  }

  // Return restaurants ordered by distance.
  return restaurants.sort(
    (a, b) =>
      a.distanceKm - b.distanceKm,
  );
}
