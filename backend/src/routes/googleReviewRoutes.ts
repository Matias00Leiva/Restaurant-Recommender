
import {
  requireAuth,
} from "../middleware/requireAuth.ts";

import {
  getGooglePlaceReviews,
} from "../services/googlePlacesService.ts";

// Avoid repeated paid Place Details requests.
let lastRequestAt = 0;

const COOLDOWN_MS = 120000;

export async function googleReviewRoutes(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname !== "/api/google-reviews") {
    return null;
  }

  if (request.method !== "GET") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405 },
    );
  }

  return await requireAuth(
    request,
    async () => {
      const placeId =
        url.searchParams.get("placeId") ?? "";

      if (
        !/^[A-Za-z0-9_-]{5,255}$/.test(placeId)
      ) {
        return Response.json(
          { error: "invalid_place_id" },
          { status: 400 },
        );
      }

      if (
        Date.now() - lastRequestAt <
        COOLDOWN_MS
      ) {
        return Response.json(
          { error: "rate_limited" },
          { status: 429 },
        );
      }

      lastRequestAt = Date.now();

      try {
        const result =
          await getGooglePlaceReviews(placeId);

        return Response.json(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "Google reviews request failed:",
          message,
        );

        if (message === "daily_quota_exceeded") {
          return Response.json(
            { error: "daily_quota_exceeded" },
            { status: 429 },
          );
        }

        return Response.json(
          { error: "google_places_unavailable" },
          { status: 502 },
        );
      }
    },
  );
}
