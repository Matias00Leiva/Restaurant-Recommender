
import { env } from "../config/env.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { searchNearbyRestaurants } from "../services/nearbyRestaurantService.ts";


const searchesInProgress = new Set<string>();


// Validate coordinates received from the frontend.
export function parseCoordinates(request: Request) {
  const params = new URL(request.url).searchParams;

  const rawLatitude = params.get("latitude");
  const rawLongitude = params.get("longitude");

  if (!rawLatitude?.trim() || !rawLongitude?.trim() ) {
    
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

const radiusKm = Number(
  params.get("radiusKm") ?? "20",
);


  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180

|| !Number.isInteger(radiusKm)
|| radiusKm < 1
|| radiusKm > 50

  ) {
    return null;
  }

  return { latitude, longitude, radiusKm };
}

// Handle nearby restaurant requests.
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

  return await requireAuth(request, async (user) => {
    const coordinates = parseCoordinates(request);

    if (!coordinates) {
      return Response.json(
        { error: "invalid_coordinates" },
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
    { error: "search_in_progress" },
    { status: 429 },
  );
}


    searchesInProgress.add(user.id);

    try {
      const restaurants = await searchNearbyRestaurants(
        coordinates.latitude,
        coordinates.longitude,
        fetch,
        env.googlePlacesApiKey,
        coordinates.radiusKm, 
      );

     
      return Response.json({ restaurants });
    } catch (error) {
      console.error(
        "Nearby search failed:",
        error instanceof Error
          ? error.message
          : "Unknown error",
      );

      return Response.json(
        { error: "places_unavailable" },
        { status: 502 },
      );
    } finally {
      searchesInProgress.delete(user.id);
    }
  });
}
