
import { app } from "../src/app.ts";

import {
  parseCoordinates,
  parseRadius,
} from "../src/routes/nearbyRestaurantRoutes.ts";

import {
  searchNearbyRestaurants,
} from "../src/services/nearbyRestaurantService.ts";

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Check authentication for nearby restaurant searches.
Deno.test("nearby search requires login", async () => {
  const response = await app(
    new Request(
      "http://localhost:8000/api/nearby-restaurants?latitude=-33&longitude=-71",
    ),
  );

  assert(
    response.status === 401,
    "Expected 401 for anonymous requests",
  );
});

// Validate coordinates and search radius.
Deno.test(
  "nearby coordinates and radius are validated",
  () => {
    const valid = new Request(
      "http://localhost:8000/api/nearby-restaurants?latitude=-33.05&longitude=-71.45&radiusKm=10",
    );

    assert(
      parseCoordinates(valid)?.latitude === -33.05,
      "Invalid latitude",
    );

    assert(
      parseRadius(valid) === 10,
      "Invalid radius parsing",
    );

    for (const query of [
      "latitude=&longitude=-71",
      "latitude=91&longitude=-71",
      "latitude=-33&longitude=-181",
      "latitude=NaN&longitude=-71",
    ]) {
      const request = new Request(
        `http://localhost:8000/api/nearby-restaurants?${query}`,
      );

      assert(
        parseCoordinates(request) === null,
        `Accepted invalid coordinates: ${query}`,
      );
    }

    for (const radius of [
      "",
      "0",
      "51",
      "1.5",
      "NaN",
    ]) {
      const request = new Request(
        `http://localhost:8000/api/nearby-restaurants?radiusKm=${radius}`,
      );

      assert(
        parseRadius(request) === null,
        `Accepted invalid radius: ${radius}`,
      );
    }
  },
);

// Check that Google restaurant data is mapped correctly.
Deno.test(
  "nearby restaurants are mapped correctly",
  async () => {
    const fakeFetch: typeof fetch =
      async (_input, init) => {
        assert(
          init?.method === "POST",
          "Expected Places POST",
        );

        const body = JSON.parse(
          String(init?.body),
        );

        assert(
          body.includedTypes[0] === "restaurant",
          "Expected restaurants",
        );

        assert(
          body.locationRestriction.circle.radius === 3000,
          "Unexpected radius",
        );

        return Response.json({
          places: [
            {
              id: "test-place-123",
              displayName: {
                text: "Test Sushi",
              },
              formattedAddress: "Test address",
              location: {
                latitude: -33.05,
                longitude: -71.45,
              },
              rating: 4.5,
              userRatingCount: 10,
              types: [
                "sushi_restaurant",
                "restaurant",
              ],
            },
          ],
        });
      };

    const results =
      await searchNearbyRestaurants(
        -33.05,
        -71.45,
        fakeFetch,
        "test-api-key",
        3,
      );

    assert(
      results.length === 1,
      "Expected one mapped restaurant",
    );

    assert(
      results[0].name === "Test Sushi",
      "Unexpected name",
    );

    assert(
      results[0].distanceKm === 0,
      "Expected zero distance",
    );

    assert(
      results[0].types.includes(
        "sushi_restaurant",
      ),
      "Missing cuisine type",
    );

    assert(
      results[0].mapsUrl.includes(
        "query_place_id",
      ),
      "Missing Google Maps URL",
    );
  },
);

// Simulate Google's exhausted daily quota without an API call.
Deno.test(
  "nearby search identifies daily Google quota exhaustion",
  async () => {
    const fakeFetch: typeof fetch =
      async () =>
        Response.json(
          {
            error: {
              status: "RESOURCE_EXHAUSTED",
              message:
                "Quota exceeded for SearchNearbyRequest per day",
            },
          },
          {
            status: 429,
          },
        );

    let detected = false;

    try {
      await searchNearbyRestaurants(
        -33.05,
        -71.45,
        fakeFetch,
        "test-api-key",
        3,
      );
    } catch (error) {
      detected =
        error instanceof Error &&
        error.message === "daily_quota_exceeded";
    }

    assert(
      detected,
      "The daily quota error was not detected",
    );
  },
);
