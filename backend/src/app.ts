
import { authRoutes } from "./routes/authRoutes.ts";
import { env } from "./config/env.ts";
import { restaurantRoutes } from "./routes/restaurantRoutes.ts";
import { activityRoutes } from "./routes/activityRoutes.ts";
import { userListRoutes } from "./routes/userListRoutes.ts";
import { googleReviewRoutes } from "./routes/googleReviewRoutes.ts";

import { nearbyRestaurantRoutes } from "./routes/nearbyRestaurantRoutes.ts";

import { googleListRoutes } from "./routes/googleListRoutes.ts";

import { googleListDetailsRoutes } from "./routes/googleListDetailsRoutes.ts";

import { googleRatingRoutes } from "./routes/googleRatingRoutes.ts";

import { realRecommendationRoutes } from "./routes/realRecommendationRoutes.ts";






export async function app(request: Request): Promise<Response> {
  let response: Response;

  try {
    // Handle CORS preflight requests.
    if (request.method === "OPTIONS") {
      response = request.headers.get("origin") === env.frontendOrigin
        ? new Response(null, { status: 204 })
        : Response.json(
          { error: "forbidden" },
          { status: 403 },
        );

    // Check if the backend is running.
    } else if (
      request.method === "GET" &&
      new URL(request.url).pathname === "/api/health"
    ) {
      response = Response.json({ status: "ok" });

    // Process authentication, activity, and restaurant routes.
    } else {
      
response = (await authRoutes(request)) ??
  (await activityRoutes(request)) ??
  (await userListRoutes(request)) ??
  (await googleListDetailsRoutes(request)) ??
  (await googleListRoutes(request)) ??
  (await googleRatingRoutes(request)) ??
  (await googleReviewRoutes(request)) ??
  (await nearbyRestaurantRoutes(request)) ??
  (await realRecommendationRoutes(request)) ??
  restaurantRoutes(request) ??

  Response.json(
    { error: "not_found" },
    { status: 404 },
  );

    }
  } catch {
    console.error("Request failed.");

    response = Response.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }

  

  // Security and cache headers.
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-content-type-options", "nosniff");

  // CORS configuration.
  response.headers.set(
    "access-control-allow-origin",
    env.frontendOrigin,
  );

  response.headers.set(
    "access-control-allow-credentials",
    "true",
  );

  response.headers.set(
    "access-control-allow-methods",
    "GET, POST, OPTIONS",
  );

  response.headers.set(
    "access-control-allow-headers",
    "Content-Type",
  );

  response.headers.append("vary", "Origin");

  return response;
}
