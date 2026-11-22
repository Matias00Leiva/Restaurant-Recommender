
import { env } from "../config/env.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

import {
  getRealRecommendations,
  type RealCandidate,
} from "../services/realRecommendationService.ts";

function isValidCandidate(value: unknown): value is RealCandidate {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.placeId === "string" &&
    /^[a-zA-Z0-9_-]{5,255}$/.test(candidate.placeId) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    candidate.name.length <= 250 &&
    typeof candidate.distanceKm === "number" &&
    Number.isFinite(candidate.distanceKm) &&
    candidate.distanceKm >= 0 &&
    candidate.distanceKm <= 50.1 &&
    (
      candidate.rating === null ||
      (
        typeof candidate.rating === "number" &&
        Number.isFinite(candidate.rating) &&
        candidate.rating >= 0 &&
        candidate.rating <= 5
      )
    ) &&

typeof candidate.ratingCount === "number" &&
Number.isSafeInteger(candidate.ratingCount) &&
candidate.ratingCount >= 0 &&
(
  candidate.types === undefined ||
  (
    Array.isArray(candidate.types) &&
    candidate.types.length <= 30 &&
    candidate.types.every(
      (type) =>
        typeof type === "string" &&
        /^[a-z_]{2,80}$/.test(type),
    )
  )
)

  );
}

export async function realRecommendationRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (path !== "/api/real-recommendations") {
    return null;
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405 },
    );
  }

  return await requireAuth(request, async (user) => {
    // Reject cross-origin state-changing requests.
    if (request.headers.get("origin") !== env.frontendOrigin) {
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

    const { restaurants } =
      body as Record<string, unknown>;

    if (
      !Array.isArray(restaurants) ||
      restaurants.length > 100 ||
      !restaurants.every(isValidCandidate)
    ) {
      return Response.json(
        { error: "invalid_restaurants" },
        { status: 400 },
      );
    }


const recommendations = await getRealRecommendations(
  user.id,
  restaurants,
);

    return Response.json({ recommendations });
  });
}
