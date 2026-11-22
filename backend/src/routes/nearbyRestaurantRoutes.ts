
import { env } from "../config/env.ts";

import {
  requireAuth,
} from "../middleware/requireAuth.ts";

import {
  searchNearbyRestaurants,
} from "../services/nearbyRestaurantService.ts";

// Prevent simultaneous searches from the same user.
const searchesInProgress = new Set<string>();

// Validate geographic coordinates.
export function parseCoordinates(
  request: Request,
): {
  latitude: number;
  longitude: number;
} | null {
  const params = new URL(request.url).searchParams;

  const rawLatitude = params.get("latitude");
  const rawLongitude = params.get("longitude");

  if (
    !rawLatitude?.trim() ||
    !rawLongitude?.trim()
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

// Validate the requested search radius.
export function parseRadius(
  request: Request,
): number | null {
  const raw = new URL(request.url)
    .searchParams.get("radiusKm");

  if (raw === null) {
    return 20;
  }

  if (!raw.trim()) {
    return null;
  }

  const radiusKm = Number(raw);

  return (
    Number.isInteger(radiusKm) &&
    radiusKm >= 1 &&
    radiusKm <= 50
  ) ? radiusKm : null;
}

// Handle requests to the nearby restaurant endpoint.
export async function nearbyRestaurantRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (path !== "/api/nearby-restaurants") {
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
    async (user) => {
      const coordinates = parseCoordinates(request);

      if (!coordinates) {
        return Response.json(
          { error: "invalid_coordinates" },
          { status: 400 },
        );
      }

      const radiusKm = parseRadius(request);

      if (radiusKm === null) {
        return Response.json(
          { error: "invalid_radius" },
          { status: 400 },
        );
      }

      if (!env.googlePlacesApiKey) {
        return Response.json(
          { error: "places_not_configured" },
          { status: 503 },
        );
      }

      if (searchesInProgress.has(user.id)) {
        return Response.json(
          { error: "rate_limited" },
          { status: 429 },
        );
      }

      searchesInProgress.add(user.id);

      try {
        const restaurants =
          await searchNearbyRestaurants(
            coordinates.latitude,
            coordinates.longitude,
            fetch,
            env.googlePlacesApiKey,
            radiusKm,
          );

        return Response.json({ restaurants });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "Nearby search failed:",
          message,
        );

        if (message === "daily_quota_exceeded") {
          return Response.json(
            { error: "daily_quota_exceeded" },
            { status: 429 },
          );
        }

        return Response.json(
          { error: "places_unavailable" },
          { status: 502 },
        );
      } finally {
        searchesInProgress.delete(user.id);
      }
    },
  );
}
