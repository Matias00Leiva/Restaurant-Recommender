
export interface GoogleReview {
  rating: number | null;
  text: string;
  author: string;
  authorUrl: string | null;
  authorPhoto: string | null;
  mapsUrl: string | null;
  published: string;
}

export interface GooglePlaceReviews {
  placeId: string;
  name: string;
  rating: number | null;
  ratingCount: number;
  mapsUrl: string | null;
  reviews: GoogleReview[];
}

export async function getGoogleReviews(): Promise<GooglePlaceReviews> {
  const response = await fetch(
    "http://localhost:8000/api/google-reviews",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (response.status === 429) {
    throw new Error("rate_limited");
  }

  if (!response.ok) {
    throw new Error("request_failed");
  }

  return await response.json() as GooglePlaceReviews;
}
