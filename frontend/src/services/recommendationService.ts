
import type { Restaurant } from "./restaurantService.ts";

export interface RecommendedRestaurant extends Restaurant {
  recommendationScore: number;
  recommendationReason: string;
}

export async function getRecommendations(): Promise<
  RecommendedRestaurant[]
> {
  const response = await fetch(
    "/api/recommendations",
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load recommendations");
  }

  const data = await response.json() as {
    restaurants: RecommendedRestaurant[];
  };

  return data.restaurants;
}
