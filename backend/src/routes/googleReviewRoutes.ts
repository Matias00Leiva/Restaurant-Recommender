
import { requireAuth } from "../middleware/requireAuth.ts";
import { getGooglePlaceReviews } from "../services/googlePlacesService.ts";

// Limit paid API calls during the local demonstration.
let lastRequestAt = 0;
const COOLDOWN_MS = 120_000;

export async function googleReviewRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (
    request.method !== "GET" ||
    path !== "/api/google-reviews"
  ) {
    return null;
  }

  return await requireAuth(request, async () => {
    if (Date.now() - lastRequestAt < COOLDOWN_MS) {
      return Response.json(
        { error: "rate_limited" },
        { status: 429 },
      );
    }

    lastRequestAt = Date.now();

    try {
      const result = await getGooglePlaceReviews();
      return Response.json(result);
    } catch (error) {
      console.error("Google Places request failed:", error);

      return Response.json(
        { error: "google_places_unavailable" },
        { status: 502 },
      );
    }
  });
}
