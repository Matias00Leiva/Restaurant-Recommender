
import { database } from "../config/database.ts";

export interface GoogleUserRating {
  placeId: string;
  rating: number;
}

// Retrieve all personal ratings for a user.
export function getGoogleRatings(
  userId: string,
): GoogleUserRating[] {
  return database.prepare(`
    SELECT
      place_id AS placeId,
      rating
    FROM google_restaurant_ratings
    WHERE user_id = ?
  `).all(userId) as unknown as GoogleUserRating[];
}

// Save, update, or remove a personal rating.
export function updateGoogleRating(
  userId: string,
  placeId: string,
  rating: number | null,
): void {
  if (rating === null) {
    database.prepare(`
      DELETE FROM google_restaurant_ratings
      WHERE user_id = ? AND place_id = ?
    `).run(userId, placeId);

    return;
  }

  database.prepare(`
    INSERT INTO google_restaurant_ratings
      (user_id, place_id, rating, updated_at)
    VALUES (?, ?, ?, ?)

    ON CONFLICT(user_id, place_id)
    DO UPDATE SET
      rating = excluded.rating,
      updated_at = excluded.updated_at
  `).run(
    userId,
    placeId,
    rating,
    new Date().toISOString(),
  );
}
