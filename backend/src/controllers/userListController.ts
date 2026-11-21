
import { env } from "../config/env.ts";
import type { User } from "../models/user.ts";

import { restaurantExists } from "../repositories/activityRepository.ts";

import {
  getUserList,
  updateUserList,
} from "../repositories/userListRepository.ts";

// Return the user's saved restaurants.
export function listSavedRestaurants(user: User): Response {
  return Response.json({
    items: getUserList(user.id),
  });
}

// Add, update, or remove a saved restaurant.
export async function saveListRestaurant(
  request: Request,
  user: User,
): Promise<Response> {
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "invalid_body" },
      { status: 400 },
    );
  }

  const { restaurantId, status } =
    body as Record<string, unknown>;

  if (
    typeof restaurantId !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(restaurantId)
  ) {
    return Response.json(
      { error: "invalid_restaurant" },
      { status: 400 },
    );
  }

  if (
    status !== "visited" &&
    status !== "to_visit" &&
    status !== null
  ) {
    return Response.json(
      { error: "invalid_status" },
      { status: 400 },
    );
  }

  if (!restaurantExists(restaurantId)) {
    return Response.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  updateUserList(user.id, restaurantId, status);

  return Response.json({ success: true });
}
