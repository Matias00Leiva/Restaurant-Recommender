
import { database } from "../config/database.ts";
import { env } from "../config/env.ts";

import {
  getCuisineTags,
  type Cuisine,
} from "./cuisineService.ts";

// Restaurant information received from Google Places.
export interface RealCandidate {
  placeId: string;
  name: string;
  distanceKm: number;
  rating: number | null;
  ratingCount: number;
  types?: string[];
}

// Reasons why a restaurant was recommended.
export type RecommendationReason =
  | "personal"
  | "cuisine"
  | "saved"
  | "search"
  | "popular"
  | "nearby";

// Final recommendation returned to the frontend.
export interface RealRecommendationScore {
  placeId: string;
  score: number;
  reason: RecommendationReason;
}

// Personal rating stored in SQLite.
interface PersonalRating {
  placeId: string;
  rating: number;
}

// Restaurant saved in a user's personal list.
interface SavedPlace {
  placeId: string;
  status: "visited" | "to_visit";
}

// Previous restaurant search.
interface SearchRow {
  search: string;
  category: string;
}

// Complete user profile used by the recommendation algorithm.
export interface RecommendationProfile {
  ratings: PersonalRating[];
  saved: SavedPlace[];
  searches: SearchRow[];
  cuisineWeights?: Partial<Record<Cuisine, number>>;
}

// --------------------------------------------------
// 1. TEXT NORMALIZATION
// --------------------------------------------------

// Normalize text to make comparisons easier.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Extract relevant search terms from search history.
function getSearchTerms(search: SearchRow): string[] {
  const category = normalize(search.category);

  const terms = normalize(
    `${search.search} ${search.category}`,
  )
    .split(/[^a-z0-9]+/)
    .filter(
      (word) =>
        word.length >= 4 &&
        ![
          "restaurante",
          "restaurantes",
          "comida",
          "restaurant",
          "restaurants",
        ].includes(word),
    );

  // Map broad food categories to common restaurant names.
  if (category.includes("japones")) {
    terms.push("sushi", "ramen", "nikkei");
  }

  if (category.includes("italian")) {
    terms.push("pizza", "pasta", "trattoria");
  }

  if (category.includes("hamburgues")) {
    terms.push("burger", "hamburguesa");
  }

  return terms;
}

// --------------------------------------------------
// 2. RESTAURANT RANKING ALGORITHM
// --------------------------------------------------

// Calculate a personalized score for each restaurant.
export function rankRealRestaurants(
  candidates: RealCandidate[],
  profile: RecommendationProfile,
): RealRecommendationScore[] {
  // Create fast lookup maps for personal ratings.
  const ratings = new Map(
    profile.ratings.map((item) => [
      item.placeId,
      item.rating,
    ]),
  );

  // Create a lookup map for saved restaurants.
  const saved = new Map(
    profile.saved.map((item) => [
      item.placeId,
      item.status,
    ]),
  );

  // Collect keywords from previous searches.
  const searchTerms = new Set(
    profile.searches.flatMap(getSearchTerms),
  );

  // Remove duplicate restaurants using Google Place IDs.
  const uniqueCandidates = new Map(
    candidates.map((item) => [
      item.placeId,
      item,
    ]),
  );

  const results: RealRecommendationScore[] = [];

  for (const restaurant of uniqueCandidates.values()) {
    const personalRating = ratings.get(
      restaurant.placeId,
    );

    const listStatus = saved.get(
      restaurant.placeId,
    );

    // Exclude visited or negatively rated restaurants.
    if (
      listStatus === "visited" ||
      (
        personalRating !== undefined &&
        personalRating <= 2
      )
    ) {
      continue;
    }

    let score = 0;

    let reason: RecommendationReason = "nearby";

    // --------------------------------------------------
    // Factor 1: Personal FoodieFind ratings
    // --------------------------------------------------

    if (personalRating !== undefined) {
      score += (personalRating - 3) * 4;

      if (personalRating >= 4) {
        reason = "personal";
      }
    }

    // --------------------------------------------------
    // Factor 2: Saved restaurants
    // --------------------------------------------------

    if (listStatus === "to_visit") {
      score += 4;

      if (reason !== "personal") {
        reason = "saved";
      }
    }

    // --------------------------------------------------
    // Factor 3: Previous searches
    // --------------------------------------------------

    const name = normalize(restaurant.name);

    const matches = [...searchTerms].filter(
      (term) => name.includes(term),
    ).length;

    score += Math.min(
      6,
      matches * 2,
    );

    if (
      matches > 0 &&
      reason !== "personal" &&
      reason !== "saved"
    ) {
      reason = "search";
    }

    // --------------------------------------------------
    // Factor 4: Learned cuisine preferences
    // --------------------------------------------------

    // Identify cuisine groups from Google Places types.
    const cuisines = getCuisineTags(
      restaurant.types ?? [],
    );

    // Calculate the user's preference for these cuisines.
    const cuisinePreference = cuisines.reduce(
      (total, cuisine) =>
        total +
        (profile.cuisineWeights?.[cuisine] ?? 0),
      0,
    );

    // Limit the impact of cuisine preferences.
    const cuisineBoost = Math.max(
      -12,
      Math.min(12, cuisinePreference),
    );

    score += cuisineBoost;

    if (
      cuisineBoost > 0 &&
      reason !== "personal" &&
      reason !== "saved"
    ) {
      reason = "cuisine";
    }

    // --------------------------------------------------
    // Factor 5: Public Google rating
    // --------------------------------------------------

    if (restaurant.rating !== null) {
      score += restaurant.rating * 0.5;

      // Give a small bonus for the number of reviews.
      score += Math.min(
        1,
        Math.log10(restaurant.ratingCount + 1) * 0.4,
      );

      if (
        restaurant.rating >= 4.5 &&
        restaurant.ratingCount >= 20 &&
        reason === "nearby"
      ) {
        reason = "popular";
      }
    }

    // --------------------------------------------------
    // Factor 6: Restaurant distance
    // --------------------------------------------------

    // Nearby restaurants receive a higher score.
    score += Math.max(
      0,
      4 - restaurant.distanceKm * 0.18,
    );

    // Store the final score and recommendation reason.
    results.push({
      placeId: restaurant.placeId,
      score: Math.round(score * 100) / 100,
      reason,
    });
  }

  // Sort from highest to lowest score.
  // Return only the five best recommendations.
  return results
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.placeId.localeCompare(b.placeId),
    )
    .slice(0, 5);
}

// --------------------------------------------------
// 3. GOOGLE PLACES CUISINE LOOKUP
// --------------------------------------------------

// Retrieve cuisine types for a previously rated place.
// Google restaurant details are not permanently stored.
async function fetchPlaceTypes(
  placeId: string,
): Promise<string[]> {
  if (!env.googlePlacesApiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${
        encodeURIComponent(placeId)
      }`,
      {
        headers: {
          "X-Goog-Api-Key": env.googlePlacesApiKey,
          "X-Goog-FieldMask": "types",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as {
      types?: unknown;
    };

    return Array.isArray(data.types)
      ? data.types.filter(
          (type): type is string =>
            typeof type === "string",
        )
      : [];
  } catch {
    // Continue without additional cuisine data if Google fails.
    return [];
  }
}

// --------------------------------------------------
// 4. USER PROFILE AND CUISINE LEARNING
// --------------------------------------------------

// Retrieve user preferences and generate recommendations.
export async function getRealRecommendations(
  userId: string,
  candidates: RealCandidate[],
): Promise<RealRecommendationScore[]> {
  // Retrieve personal restaurant ratings.
  const ratings = database.prepare(`
    SELECT
      place_id AS placeId,
      rating
    FROM google_restaurant_ratings
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as unknown as PersonalRating[];

  // Retrieve restaurants in the user's saved lists.
  const saved = database.prepare(`
    SELECT
      place_id AS placeId,
      status
    FROM google_restaurant_lists
    WHERE user_id = ?
  `).all(userId) as unknown as SavedPlace[];

  // Retrieve the user's most recent searches.
  const searches = database.prepare(`
    SELECT
      search,
      category
    FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId) as unknown as SearchRow[];

  // --------------------------------------------------
  // Step 1: Select recent personal ratings
  // --------------------------------------------------

  // A rating of 3 is considered neutral.
  const recentRatings = ratings
    .filter((item) => item.rating !== 3)
    .slice(0, 5);

  // --------------------------------------------------
  // Step 2: Reuse available cuisine information
  // --------------------------------------------------

  const candidateTypes = new Map(
    candidates.map((item) => [
      item.placeId,
      item.types ?? [],
    ]),
  );

  // --------------------------------------------------
  // Step 3: Retrieve missing Google cuisine types
  // --------------------------------------------------

  const ratedPlaces = await Promise.all(
    recentRatings.map(async (item) => {
      const currentTypes =
        candidateTypes.get(item.placeId) ?? [];

      const types = currentTypes.length > 0
        ? currentTypes
        : await fetchPlaceTypes(item.placeId);

      return {
        rating: item.rating,
        types,
      };
    }),
  );

  // --------------------------------------------------
  // Step 4: Learn cuisine preferences
  // --------------------------------------------------

  const cuisineWeights: Partial<
    Record<Cuisine, number>
  > = {};

  for (const item of ratedPlaces) {
    const cuisines = getCuisineTags(item.types);

    for (const cuisine of cuisines) {
      cuisineWeights[cuisine] =
        (cuisineWeights[cuisine] ?? 0) +
        (item.rating - 3) * 3;
    }
  }

  // --------------------------------------------------
  // Step 5: Limit cuisine preference weights
  // --------------------------------------------------

  for (const cuisine of Object.keys(
    cuisineWeights,
  ) as Cuisine[]) {
    const weight = cuisineWeights[cuisine] ?? 0;

    cuisineWeights[cuisine] = Math.max(
      -12,
      Math.min(12, weight),
    );
  }

  // --------------------------------------------------
  // Step 6: Generate final recommendations
  // --------------------------------------------------

  return rankRealRestaurants(candidates, {
    ratings,
    saved,
    searches,
    cuisineWeights,
  });
}
