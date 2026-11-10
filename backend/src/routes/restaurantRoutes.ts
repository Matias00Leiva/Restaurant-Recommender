import { listRestaurants } from "../controllers/restaurantController.ts";

export function restaurantRoutes(request: Request): Response | null {
  const path = new URL(request.url).pathname;

  if (
    request.method === "GET" &&
    path === "/api/restaurants"
  ) {
    return listRestaurants(request);
  }

  return null;
}