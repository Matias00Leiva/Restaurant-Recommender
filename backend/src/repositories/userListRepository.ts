
import { database } from "../config/database.ts";

export type ListStatus = "visited" | "to_visit";

export interface UserListItem {
  restaurantId: string;
  status: ListStatus;
}

// Get the authenticated user's saved restaurants.
export function getUserList(userId: string): UserListItem[] {
  return database.prepare(`
    SELECT
      restaurant_id AS restaurantId,
      status
    FROM user_restaurant_lists
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as unknown as UserListItem[];
}

// Add, update, or remove a restaurant from the user's list.
export function updateUserList(
  userId: string,
  restaurantId: string,
  status: ListStatus | null,
): void {
  if (status === null) {
    database.prepare(`
      DELETE FROM user_restaurant_lists
      WHERE user_id = ? AND restaurant_id = ?
    `).run(userId, restaurantId);

    return;
  }

  database.prepare(`
    INSERT INTO user_restaurant_lists
      (user_id, restaurant_id, status, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, restaurant_id)
    DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run(
    userId,
    restaurantId,
    status,
    new Date().toISOString(),
  );
}
