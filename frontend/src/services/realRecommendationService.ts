
import type {
  NearbyRestaurant,
} from "./nearbyRestaurantService.ts";

const API_URL =
  import.meta.env.VITE_API_URL ??
  window.location.origin;

export type RealRecommendationReason =
  | "personal"
  | "cuisine"
  | "saved"
  | "search"
  | "popular"
  | "nearby";

interface RecommendationScore {
  placeId: string;
  score: number;
  reason: RealRecommendationReason;
}

export interface RealRecommendedRestaurant
  extends NearbyRestaurant {
  recommendationScore: number;
  recommendationReason: RealRecommendationReason;
}

// Rank Google Places results using the user's SQLite profile.
export async function getRealRecommendations(
  restaurants: NearbyRestaurant[],
): Promise<RealRecommendedRestaurant[]> {
  const response = await fetch(
    `${API_URL}/api/real-recommendations`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restaurants: restaurants.map((restaurant) => ({
          placeId: restaurant.placeId,
          name: restaurant.name,
          distanceKm: restaurant.distanceKm,
          rating: restaurant.rating,
          ratingCount: restaurant.ratingCount,
          types: restaurant.types ?? [],
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("recommendation_failed");
  }

  const data = await response.json() as {
    recommendations: RecommendationScore[];
  };

  const restaurantMap = new Map(
    restaurants.map((restaurant) => [
      restaurant.placeId,
      restaurant,
    ]),
  );

  return data.recommendations.flatMap((item) => {
    const restaurant = restaurantMap.get(item.placeId);

    if (!restaurant) {
      return [];
    }

    return [{
      ...restaurant,
      recommendationScore: item.score,
      recommendationReason: item.reason,
    }];
  });
}
