
import { database } from "../config/database.ts";
import { getAllRestaurants } from "../repositories/restaurantRepository.ts";
import type { Restaurant } from "../models/restaurant.ts";

interface RatingRow {
  category: string;
  rating: number;
}

interface HistoryRow {
  search: string;
  category: string;
  maxPrice: number | null;
}

export interface RecommendedRestaurant extends Restaurant {
  recommendationScore: number;
  recommendationReason: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("es");
}

export function getRecommendations(
  userId: string,
): RecommendedRestaurant[] {
  // Read ratings belonging to the authenticated user.
  const ratings = database.prepare(`
    SELECT restaurants.category, ratings.rating
    FROM ratings
    JOIN restaurants
      ON restaurants.id = ratings.restaurant_id
    WHERE ratings.user_id = ?
  `).all(userId) as unknown as RatingRow[];

  // Read the user's latest searches.
  const history = database.prepare(`
    SELECT
      search,
      category,
      max_price AS maxPrice
    FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId) as unknown as HistoryRow[];

  const latestBudget = history.find(
    (item) => item.maxPrice !== null,
  )?.maxPrice ?? null;

  const recommendations = getAllRestaurants().map(
    (restaurant): RecommendedRestaurant => {
      let score = 0;
      let reason = "Una opción para descubrir";

      const category = normalize(restaurant.category);

      // Rating affinity: positive and negative preferences.
      const ratingPreference = ratings
        .filter((item) => normalize(item.category) === category)
        .reduce(
          (total, item) => total + (item.rating - 3) * 2,
          0,
        );

      score += Math.max(-8, Math.min(8, ratingPreference));

      if (ratingPreference > 0) {
        reason = "Coincide con tus calificaciones";
      }

      // Category affinity from previous searches.
      const categorySearches = history.filter(
        (item) => normalize(item.category) === category,
      ).length;

      score += Math.min(6, categorySearches * 2);

      if (categorySearches > 0 && ratingPreference <= 0) {
        reason = "Coincide con tus categorías favoritas";
      }

      // Match previous search terms with restaurant information.
      const restaurantText = normalize(
        `${restaurant.name} ${restaurant.description} ${restaurant.category}`,
      );

      const textMatches = history.filter(
        (item) =>
          normalize(item.search) !== "" &&
          restaurantText.includes(normalize(item.search)),
      ).length;

      score += Math.min(3, textMatches);

      if (
        textMatches > 0 &&
        categorySearches === 0 &&
        ratingPreference <= 0
      ) {
        reason = "Relacionado con tus búsquedas";
      }

      // Use the latest recorded budget as a preference.
      if (latestBudget !== null) {
        if (restaurant.averagePrice <= latestBudget) {
          score += 1;

          if (
            ratingPreference <= 0 &&
            categorySearches === 0 &&
            textMatches === 0
          ) {
            reason = "Se ajusta a tu presupuesto";
          }
        } else {
          score -= 1;
        }
      }

      // General user ratings help with cold-start recommendations.
      if (restaurant.averageRating !== null) {
        score += restaurant.averageRating * 0.2;
      }

      return {
        ...restaurant,
        recommendationScore: Math.round(score * 10) / 10,
        recommendationReason: reason,
      };
    },
  );

  return recommendations
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);
}
