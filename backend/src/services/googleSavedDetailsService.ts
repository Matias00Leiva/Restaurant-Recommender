
import { env } from "../config/env.ts";

import type {
  GoogleListItem,
} from "../repositories/googleListRepository.ts";

export interface SavedGoogleRestaurant extends GoogleListItem {
  name: string | null;
  address: string | null;
  mapsUrl: string;
}

interface GooglePlaceDetails {
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
}

function fallbackMapsUrl(placeId: string): string {
  const url = new URL(
    "https://www.google.com/maps/search/",
  );

  url.searchParams.set("api", "1");
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("query_place_id", placeId);

  return url.toString();
}

// Retrieve live place details without storing Google content.
export async function getSavedGoogleDetails(
  items: GoogleListItem[],
): Promise<SavedGoogleRestaurant[]> {
  if (!env.googlePlacesApiKey) {
    throw new Error("Google Places API key is missing");
  }


if (items.length === 0) {
  return [];
}


  const results: SavedGoogleRestaurant[] = [];

  // Limit paid detail requests per page load.
  const MAX_DETAILS = 20;
  const BATCH_SIZE = 3;

  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    const batch = items.slice(offset, offset + BATCH_SIZE);

    const mapped = await Promise.all(
      batch.map(async (item, index) => {
        const fallback: SavedGoogleRestaurant = {
          ...item,
          name: null,
          address: null,
          mapsUrl: fallbackMapsUrl(item.placeId),
        };

        // Entries beyond the limit remain manageable by Place ID.
        if (offset + index >= MAX_DETAILS) {
          return fallback;
        }

        try {
          const response = await fetch(
            `https://places.googleapis.com/v1/places/${
              encodeURIComponent(item.placeId)
            }?languageCode=es`,
            {
              headers: {
                "X-Goog-Api-Key":
                  env.googlePlacesApiKey,
                "X-Goog-FieldMask":
                  "displayName,formattedAddress,googleMapsUri",
              },
              signal: AbortSignal.timeout(8000),
            },
          );

          if (!response.ok) {
            return fallback;
          }

          const place =
            await response.json() as GooglePlaceDetails;

          return {
            ...item,
            name: place.displayName?.text ?? null,
            address: place.formattedAddress ?? null,
            mapsUrl: place.googleMapsUri ??
              fallback.mapsUrl,
          };
        } catch {
          return fallback;
        }
      }),
    );

    results.push(...mapped);
  }

  return results;
}
