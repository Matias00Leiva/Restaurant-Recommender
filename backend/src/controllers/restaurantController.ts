import { getAllRestaurants } from "../repositories/restaurantRepository.ts";

export function listRestaurants(): Response {
  const restaurants = getAllRestaurants();

  return Response.json({
    restaurants,
  });
}