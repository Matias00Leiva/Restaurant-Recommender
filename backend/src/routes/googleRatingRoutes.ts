
import { env } from "../config/env.ts";

import { requireAuth } from "../middleware/requireAuth.ts";

import {
  getGoogleRatings,
  updateGoogleRating,
} from "../repositories/googleRatingRepository.ts";

// Handle the current user's personal Google restaurant ratings.
export async function googleRatingRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (path !== "/api/google-ratings") {
    return null;
  }

  // Retrieve the user's personal ratings.
  if (request.method === "GET") {
    return await requireAuth(request, (user) =>
      Response.json({
        ratings: getGoogleRatings(user.id),
      })
    );
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405 },
    );
  }

  return await requireAuth(request, async (user) => {
    // Prevent cross-origin requests from modifying ratings.
    if (
      request.headers.get("origin") !==
      env.frontendOrigin
    ) {
      return Response.json(
        { error: "invalid_origin" },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "invalid_json" },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return Response.json(
        { error: "invalid_body" },
        { status: 400 },
      );
    }

    const { placeId, rating } =
      body as Record<string, unknown>;

    // Validate the Google Place ID.
    if (
      typeof placeId !== "string" ||
      !/^[a-zA-Z0-9_-]{5,255}$/.test(placeId)
    ) {
      return Response.json(
        { error: "invalid_place_id" },
        { status: 400 },
      );
    }

    // Accept a rating from 1 to 5, or null to remove it.
    if (
      rating !== null &&
      (
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      )
    ) {
      return Response.json(
        { error: "invalid_rating" },
        { status: 400 },
      );
    }

    updateGoogleRating(user.id, placeId, rating);

    return Response.json({
      success: true,
    });
  });
}
