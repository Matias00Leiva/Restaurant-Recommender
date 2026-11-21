
import {
  addRating,
  addSearchHistory,
  listSearchHistory,
} from "../controllers/activityController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

import { getRecommendations } from "../services/recommendationService.ts";


export async function activityRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  const ratingMatch = path.match(
    /^\/api\/restaurants\/([a-zA-Z0-9-]+)\/ratings$/,
  );

  if (request.method === "POST" && ratingMatch) {
    return await requireAuth(
      request,
      (user) => addRating(request, user, ratingMatch[1]),
    );
  }

  if (path === "/api/search-history") {
    if (request.method === "POST") {
      return await requireAuth(
        request,
        (user) => addSearchHistory(request, user),
      );
    }

    if (request.method === "GET") {
      return await requireAuth(
        request,
        listSearchHistory,
      );
    }
  }


if (
  request.method === "GET" &&
  path === "/api/recommendations"
) {
  return await requireAuth(
    request,
    (user) => Response.json({
      restaurants: getRecommendations(user.id),
    }),
  );
}


  return null;
}
