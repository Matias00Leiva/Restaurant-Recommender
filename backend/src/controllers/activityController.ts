
import { env } from "../config/env.ts";
import type { User } from "../models/user.ts";
import {
  getSearchHistory,
  restaurantExists,
  saveRating,
  saveSearchHistory,
} from "../repositories/activityRepository.ts";

function validOrigin(request: Request): boolean {
  return request.headers.get("origin") === env.frontendOrigin;
}

export async function addRating(
  request: Request,
  user: User,
  restaurantId: string,
): Promise<Response> {
  if (!validOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }

  if (!restaurantExists(restaurantId)) {
    return Response.json({ error: "restaurant_not_found" }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { rating } = body as Record<string, unknown>;

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return Response.json({ error: "invalid_rating" }, { status: 400 });
  }

  saveRating(user.id, restaurantId, rating);
  return Response.json({ success: true });
}

export async function addSearchHistory(
  request: Request,
  user: User,
): Promise<Response> {
  if (!validOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const search = values.search ?? "";
  const category = values.category ?? "";
  const rawPrice = values.maxPrice;

  if (
    typeof search !== "string" ||
    typeof category !== "string" ||
    search.length > 100 ||
    category.length > 80
  ) {
    return Response.json({ error: "invalid_filters" }, { status: 400 });
  }

  const maxPrice = rawPrice === undefined || rawPrice === null
    ? null
    : rawPrice;

  if (
    maxPrice !== null &&
    (typeof maxPrice !== "number" ||
      !Number.isSafeInteger(maxPrice) ||
      maxPrice < 0)
  ) {
    return Response.json({ error: "invalid_price" }, { status: 400 });
  }

  if (!search.trim() && !category.trim() && maxPrice === null) {
    return Response.json({ error: "empty_search" }, { status: 400 });
  }

  saveSearchHistory(user.id, {
    search: search.trim(),
    category: category.trim(),
    maxPrice: maxPrice as number | null,
  });

  return Response.json({ success: true }, { status: 201 });
}

export function listSearchHistory(user: User): Response {
  return Response.json({
    history: getSearchHistory(user.id),
  });
}
