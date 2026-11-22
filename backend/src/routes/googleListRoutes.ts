
import { env } from "../config/env.ts";

import { requireAuth } from "../middleware/requireAuth.ts";

import {
  getGoogleList,
  updateGoogleList,
} from "../repositories/googleListRepository.ts";

// Handle the authenticated user's Google restaurant lists.
export async function googleListRoutes(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (path !== "/api/google-my-lists") {
    return null;
  }

  // Read saved restaurants.
  if (request.method === "GET") {
    return await requireAuth(request, (user) =>
      Response.json({
        items: getGoogleList(user.id),
      })
    );
  }

  // Reject unsupported HTTP methods.
  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405 },
    );
  }

  return await requireAuth(request, async (user) => {
    // Validate the request origin.
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

    const { placeId, status } =
      body as Record<string, unknown>;

    // Validate the Google Place ID format.
    if (
      typeof placeId !== "string" ||
      !/^[a-zA-Z0-9_-]{5,255}$/.test(placeId)
    ) {
      return Response.json(
        { error: "invalid_place_id" },
        { status: 400 },
      );
    }

    // Validate the saved status.
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

    updateGoogleList(user.id, placeId, status);

    return Response.json({ success: true });
  });
}
