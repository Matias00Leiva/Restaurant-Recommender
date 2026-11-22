
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  averagePrice: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface RestaurantFilters {
  search?: string;
  category?: string;
  maxPrice?: number;
}

export async function getRestaurants(
  filters: RestaurantFilters = {},
): Promise<Restaurant[]> {
  const url = new URL("/api/restaurants", window.location.origin);

  if (filters.search?.trim()) {
    url.searchParams.set("search", filters.search.trim());
  }

  if (filters.category) {
    url.searchParams.set("category", filters.category);
  }

  if (filters.maxPrice !== undefined) {
    url.searchParams.set("maxPrice", String(filters.maxPrice));
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No se pudieron obtener los restaurantes.");
  }

  const data = await response.json() as {
    restaurants: Restaurant[];
  };

  return data.restaurants;
}
