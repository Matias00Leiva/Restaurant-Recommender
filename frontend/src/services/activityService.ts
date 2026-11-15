
import type { RestaurantFilters } from "./restaurantService.ts";

const API_URL = "http://localhost:8000";

// Structure of a saved search.
export interface SearchHistoryItem {
  id: string;
  search: string;
  category: string;
  maxPrice: number | null;
  createdAt: string;
}

// Save or update a restaurant rating.
export async function rateRestaurant(
  restaurantId: string,
  rating: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/restaurants/${encodeURIComponent(restaurantId)}/ratings`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save restaurant rating");
  }
}

// Save the filters used in a search.
export async function saveSearchHistory(
  filters: RestaurantFilters,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/search-history`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search: filters.search ?? "",
        category: filters.category ?? "",
        maxPrice: filters.maxPrice ?? null,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save search history");
  }
}

// Get the user's latest saved searches.
export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  const response = await fetch(
    `${API_URL}/api/search-history`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load search history");
  }

  const data = await response.json() as {
    history: SearchHistoryItem[];
  };

  return data.history;
}
