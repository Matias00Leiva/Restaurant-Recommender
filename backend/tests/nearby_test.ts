
import { app } from "../src/app.ts";
import { parseCoordinates } from "../src/routes/nearbyRestaurantRoutes.ts";
import { searchNearbyRestaurants } from "../src/services/nearbyRestaurantService.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test("nearby search requires login", async () => {
  const request = new Request(
    "http://localhost:8000/api/nearby-restaurants?latitude=-33&longitude=-71",
  );

  const response = await app(request);

  assert(
    response.status === 401,
    "Expected unauthorized response",
  );
});

Deno.test("nearby coordinates are validated", () => {
  const valid = parseCoordinates(
    new Request(
      "http://localhost:8000/api/nearby-restaurants?latitude=-33&longitude=-71",
    ),
  );

  assert(valid !== null, "Coordinates should be valid");

  const invalid = parseCoordinates(
    new Request(
      "http://localhost:8000/api/nearby-restaurants?latitude=100&longitude=-71",
    ),
  );

  assert(invalid === null, "Latitude should be rejected");
});

Deno.test("nearby restaurants are mapped correctly", async () => {
  const fakeFetch: typeof fetch = async (_input, options) => {
    assert(
      options?.method === "POST",
      "Expected a POST request",
    );

    return Response.json({
      places: [
        {
          id: "test-place",
          displayName: { text: "Test Restaurant" },
          formattedAddress: "Test address",
          location: {
            latitude: -33,
            longitude: -71,
          },
        },
      ],
    });
  };

  const results = await searchNearbyRestaurants(
    -33,
    -71,
    fakeFetch,
    "test-api-key",
  );

  assert(results.length === 1, "Expected one result");
  assert(
    results[0].name === "Test Restaurant",
    "Unexpected restaurant name",
  );
  assert(
    results[0].distanceKm === 0,
    "Expected zero distance",
  );
});
