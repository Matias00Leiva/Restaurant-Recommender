
import { database } from "../config/database.ts";

export interface SearchInput {
  search: string;
  category: string;
  maxPrice: number | null;
}

export interface SearchHistoryItem extends SearchInput {
  id: string;
  createdAt: string;
}

export function restaurantExists(id: string): boolean {
  return database.prepare(
    "SELECT id FROM restaurants WHERE id = ?",
  ).get(id) !== undefined;
}

export function saveRating(
  userId: string,
  restaurantId: string,
  rating: number,
): void {
  database.prepare(`
    INSERT INTO ratings (user_id, restaurant_id, rating, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, restaurant_id) DO UPDATE SET
      rating = excluded.rating,
      created_at = excluded.created_at
  `).run(userId, restaurantId, rating, new Date().toISOString());
}

export function saveSearchHistory(
  userId: string,
  filters: SearchInput,
): void {
  database.prepare(`
    INSERT INTO search_history
    (id, user_id, search, category, max_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    filters.search,
    filters.category,
    filters.maxPrice,
    new Date().toISOString(),
  );
}

export function getSearchHistory(
  userId: string,
): SearchHistoryItem[] {
  return database.prepare(`
    SELECT
      id,
      search,
      category,
      max_price AS maxPrice,
      created_at AS createdAt
    FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(userId) as unknown as SearchHistoryItem[];
}
