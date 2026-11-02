import { database } from "../config/database.ts";
import type { Restaurant } from "../models/restaurant.ts";

const restaurantColumns = `
  id,
  name,
  description,
  category,
  address,
  latitude,
  longitude,
  image_url AS imageUrl
`;

export function getAllRestaurants(): Restaurant[] {
  return database
    .prepare(`SELECT ${restaurantColumns} FROM restaurants`)
    .all() as unknown as Restaurant[];
}