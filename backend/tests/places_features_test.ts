
import {
  searchNearbyRestaurants,
} from "../src/services/nearbyRestaurantService.ts";

import {
  getGooglePlaceReviews,
} from "../src/services/googlePlacesService.ts";

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Verify Google Places price-level mapping.
Deno.test(
  "nearby restaurants include real Google price levels",
  async () => {
    const fakeFetch: typeof fetch =
      async () =>
        Response.json({
          places: [
            {
              id: "test-place-123",
              displayName: {
                text: "Test Restaurant",
              },
              formattedAddress: "Test address",
              location: {
                latitude: -33.05,
                longitude: -71.45,
              },
              rating: 4.5,
              userRatingCount: 25,
              types: [
                "restaurant",
                "italian_restaurant",
              ],
              priceLevel:
                "PRICE_LEVEL_MODERATE",
            },
          ],
        });

    const results =
      await searchNearbyRestaurants(
        -33.05,
        -71.45,
        fakeFetch,
        "fake-api-key",
        3,
      );

    assert(
      results.length === 1,
      "Expected one restaurant",
    );

    assert(
      results[0].priceLevel ===
        "PRICE_LEVEL_MODERATE",
      "Google price level was not preserved",
    );

    assert(
      results[0].types.includes(
        "italian_restaurant",
      ),
      "Cuisine types were not preserved",
    );
  },
);

// Verify that reviews are requested for the selected place.
Deno.test(
  "reviews use the selected Google Place ID",
  async () => {
    const placeId = "test-place-456";

    const fakeFetch: typeof fetch =
      async (input) => {
        assert(
          String(input).includes(placeId),
          "The selected Place ID was not used",
        );

        return Response.json({
          displayName: {
            text: "Selected Restaurant",
          },
          rating: 4.3,
          userRatingCount: 100,
          reviews: [
            {
              rating: 5,
              text: {
                text: "Excellent food",
              },
              publishTime:
                "2026-11-01T12:00:00Z",
              authorAttribution: {
                displayName: "Test User",
              },
            },
          ],
        });
      };

    const result = await getGooglePlaceReviews(
      placeId,
      fakeFetch,
      "fake-api-key",
    );

    assert(
      result.placeId === placeId,
      "Incorrect Google Place ID",
    );

    assert(
      result.name === "Selected Restaurant",
      "Incorrect restaurant name",
    );

    assert(
      result.reviews.length === 1,
      "Expected one review",
    );

    assert(
      result.reviews[0].rating === 5,
      "Incorrect review rating",
    );

    assert(
      result.reviews[0].publishedAt ===
        "2026-11-01T12:00:00Z",
      "Review publication date was not preserved",
    );
  },
);
