
import { env } from "../config/env.ts";

const GOOGLE_PLACES_BASE =
  "https://places.googleapis.com/v1/places";

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
  publishTime?: string;
}

interface GooglePlace {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GoogleReview[];
}

// Retrieve actual reviews for the selected Google Place ID.
export async function getGooglePlaceReviews(
  placeId: string,
  fetcher: typeof fetch = fetch,
  apiKey = env.googlePlacesApiKey,
) {
  if (!apiKey) {
    throw new Error(
      "Google Places API key is missing",
    );
  }

  if (!/^[A-Za-z0-9_-]{5,255}$/.test(placeId)) {
    throw new Error("Invalid Google Place ID");
  }

  const url = new URL(
    `${GOOGLE_PLACES_BASE}/${encodeURIComponent(placeId)}`,
  );

  url.searchParams.set("languageCode", "es");

  const response = await fetcher(url.toString(), {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "displayName",
        "rating",
        "userRatingCount",
        "googleMapsUri",
        "reviews",
      ].join(","),
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text();

    if (
      response.status === 429 &&
      body.includes("RESOURCE_EXHAUSTED") &&
      /per day|daily/i.test(body)
    ) {
      throw new Error("daily_quota_exceeded");
    }

    throw new Error(
      `Google Places HTTP ${response.status}`,
    );
  }

  const data = await response.json() as GooglePlace;

  return {
    placeId,
    name:
      data.displayName?.text ??
      "Restaurante de Google Maps",
    rating:
      typeof data.rating === "number"
        ? data.rating
        : null,
    ratingCount:
      typeof data.userRatingCount === "number"
        ? data.userRatingCount
        : 0,
    mapsUrl: data.googleMapsUri ?? null,
    reviews: (data.reviews ?? []).map((review) => ({
      rating:
        typeof review.rating === "number"
          ? review.rating
          : null,
      text: review.text?.text ?? "",
      author:
        review.authorAttribution?.displayName ??
        "Usuario de Google Maps",
      authorUrl:
        review.authorAttribution?.uri ?? null,
      authorPhoto:
        review.authorAttribution?.photoUri ?? null,
      mapsUrl: review.googleMapsUri ?? null,
      published:
        review.relativePublishTimeDescription ?? "",
      publishedAt:
        review.publishTime ?? null,
    })),
  };
}
