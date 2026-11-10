import { database } from "../config/database.ts";
import type { Restaurant } from "../models/restaurant.ts";

export interface RestaurantFilters {
  search?: string;
  category?: string;
  maxPrice?: number;
}

const restaurantColumns = `
  id,
  name,
  description,
  category,
  address,
  latitude,
  longitude,
  image_url AS imageUrl,
  average_price AS averagePrice
`;

export function getAllRestaurants(
  filters: RestaurantFilters = {},
): Restaurant[] {
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filters.search?.trim()) {
    conditions.push("LOWER(name) LIKE LOWER(?)");
    values.push(`%${filters.search.trim()}%`);
  }

  if (filters.category?.trim()) {
    conditions.push("LOWER(category) = LOWER(?)");
    values.push(filters.category.trim());
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("average_price <= ?");
    values.push(filters.maxPrice);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  return database
    .prepare(`
      SELECT ${restaurantColumns}
      FROM restaurants
      ${whereClause}
      ORDER BY name
    `)
    .all(...values) as unknown as Restaurant[];
}