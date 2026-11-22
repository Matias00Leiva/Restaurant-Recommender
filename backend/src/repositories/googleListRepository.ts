
import { database } from "../config/database.ts";

export type GoogleListStatus =
  | "visited"
  | "to_visit";

export interface GoogleListItem {
  placeId: string;
  status: GoogleListStatus;
}

// Get the user's saved Google restaurants.
export function getGoogleList(
  userId: string,
): GoogleListItem[] {
  return database.prepare(`
    SELECT
      place_id AS placeId,
      status
    FROM google_restaurant_lists
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as unknown as GoogleListItem[];
}

// Add, update, or remove a Google restaurant.
export function updateGoogleList(
  userId: string,
  placeId: string,
  status: GoogleListStatus | null,
): void {
  if (status === null) {
    database.prepare(`
      DELETE FROM google_restaurant_lists
      WHERE user_id = ? AND place_id = ?
    `).run(userId, placeId);

    return;
  }

  database.prepare(`
    INSERT INTO google_restaurant_lists
      (user_id, place_id, status, updated_at)
    VALUES (?, ?, ?, ?)

    ON CONFLICT(user_id, place_id)
    DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run(
    userId,
    placeId,
    status,
    new Date().toISOString(),
  );
}
