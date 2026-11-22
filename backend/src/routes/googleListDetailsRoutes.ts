
import { requireAuth } from "../middleware/requireAuth.ts";

import {
  getGoogleList,
} from "../repositories/googleListRepository.ts";

import {
  getSavedGoogleDetails,
} from "../services/googleSavedDetailsService.ts";

// Return the current user's saved Google restaurants.
export async function googleListDetailsRoutes(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname !== "/api/google-my-lists/details") {
    return null;
  }

  if (request.method !== "GET") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405 },
    );
  }

  return await requireAuth(request, async (user) => {
    const savedItems = getGoogleList(user.id);
    const requestedId = url.searchParams.get("placeId");

    // Single-place requests must belong to the current user.
    const items = requestedId
      ? savedItems.filter(
        (item) => item.placeId === requestedId,
      )
      : savedItems;

    try {
      const restaurants =
        await getSavedGoogleDetails(items);

      return Response.json({
        items: restaurants,
      });
    } catch {
      return Response.json(
        { error: "google_details_unavailable" },
        { status: 502 },
      );
    }
  });
}
