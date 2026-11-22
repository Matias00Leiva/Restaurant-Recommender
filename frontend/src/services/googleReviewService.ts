
const API_URL =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

export interface GoogleReview {
  rating: number | null;
  text: string;
  author: string;
  authorUrl: string | null;
  authorPhoto: string | null;
  mapsUrl: string | null;
  published: string;
  publishedAt: string | null;
}

export interface GooglePlaceReviews {
  placeId: string;
  name: string;
  rating: number | null;
  ratingCount: number;
  mapsUrl: string | null;
  reviews: GoogleReview[];
}

// Retrieve reviews for a specific restaurant.
export async function getGoogleReviews(
  placeId: string,
): Promise<GooglePlaceReviews> {
  const url = new URL(
    "/api/google-reviews",
    API_URL,
  );

  url.searchParams.set("placeId", placeId);

  const response = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json()
      .catch(() => null) as {
        error?: string;
      } | null;

    if (data?.error === "daily_quota_exceeded") {
      throw new Error("daily_quota_exceeded");
    }

    if (response.status === 429) {
      throw new Error("rate_limited");
    }

    throw new Error("request_failed");
  }

  return await response.json() as GooglePlaceReviews;
}
