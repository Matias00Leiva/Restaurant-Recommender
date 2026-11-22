
const API_URL =
  import.meta.env.VITE_API_URL ??
  window.location.origin;

export const GOOGLE_RATING_EVENT =
  "foodiefind-google-rating-changed";

export interface GoogleUserRating {
  placeId: string;
  rating: number;
}

// Retrieve the current user's personal ratings.
export async function getGoogleRatings(): Promise<
  GoogleUserRating[]
> {
  const response = await fetch(
    `${API_URL}/api/google-ratings`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load personal ratings",
    );
  }

  const data = await response.json() as {
    ratings: GoogleUserRating[];
  };

  return data.ratings;
}

// Save or remove a personal rating in SQLite.
export async function saveGoogleRating(
  placeId: string,
  rating: number | null,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/google-ratings`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        placeId,
        rating,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to save personal rating",
    );
  }

  // Notify other components after a successful change.
  window.dispatchEvent(
    new Event(GOOGLE_RATING_EVENT),
  );
}
