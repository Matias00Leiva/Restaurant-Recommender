
import {
  listSavedRestaurants,
  saveListRestaurant,
} from "../controllers/userListController.ts";

import { requireAuth } from "../middleware/requireAuth.ts";

export async function userListRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (path !== "/api/my-lists") {
    return null;
  }

  if (request.method === "GET") {
    return await requireAuth(
      request,
      listSavedRestaurants,
    );
  }

  if (request.method === "POST") {
    return await requireAuth(
      request,
      (user) => saveListRestaurant(request, user),
    );
  }

  return Response.json(
    { error: "method_not_allowed" },
    { status: 405 },
  );
}
