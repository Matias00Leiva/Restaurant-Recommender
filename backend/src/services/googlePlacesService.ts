
import { env } from "../config/env.ts";

const PLACE_ID = "ChIJraBBsefdiZYRrWAqkj4l9Q4";

interface GoogleReview {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  googleMapsUri?: string;
  relativePublishTimeDescription?: string;
}

interface GooglePlace {
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GoogleReview[];
}

export async function getGooglePlaceReviews() {
  if (!env.googlePlacesApiKey) {
    throw new Error("Google Places API key is missing");
  }

  const url = new URL(
    `https://places.googleapis.com/v1/places/${PLACE_ID}`,
  );

  url.searchParams.set("languageCode", "es");

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask":
        "displayName,rating,userRatingCount,googleMapsUri,reviews",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Google Places HTTP ${response.status}`);
  }

  const data = await response.json() as GooglePlace;

  return {
    placeId: PLACE_ID,
    name: data.displayName?.text ?? "La Flor de Chile",
    rating: data.rating ?? null,
    ratingCount: data.userRatingCount ?? 0,
    mapsUrl: data.googleMapsUri ?? null,
    reviews: (data.reviews ?? []).map((review) => ({
      rating: review.rating ?? null,
      text: review.text?.text ?? "",
      author: review.authorAttribution?.displayName ?? "",
      authorUrl: review.authorAttribution?.uri ?? null,
      authorPhoto: review.authorAttribution?.photoUri ?? null,
      mapsUrl: review.googleMapsUri ?? null,
      published: review.relativePublishTimeDescription ?? "",
    })),
  };
}
