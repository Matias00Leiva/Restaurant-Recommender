
export type Cuisine =
  | "japanese"
  | "italian"
  | "burgers"
  | "mexican"
  | "peruvian"
  | "chinese"
  | "korean"
  | "indian"
  | "seafood"
  | "vegetarian";

// Map Google Places types to cuisine groups.
const CUISINE_BY_TYPE: Record<string, Cuisine> = {
  japanese_restaurant: "japanese",
  sushi_restaurant: "japanese",
  ramen_restaurant: "japanese",
  japanese_izakaya_restaurant: "japanese",
  japanese_curry_restaurant: "japanese",

  italian_restaurant: "italian",
  pizza_restaurant: "italian",

  hamburger_restaurant: "burgers",

  mexican_restaurant: "mexican",
  taco_restaurant: "mexican",
  tex_mex_restaurant: "mexican",

  peruvian_restaurant: "peruvian",

  chinese_restaurant: "chinese",
  dim_sum_restaurant: "chinese",

  korean_restaurant: "korean",
  korean_barbecue_restaurant: "korean",

  indian_restaurant: "indian",

  seafood_restaurant: "seafood",

  vegetarian_restaurant: "vegetarian",
  vegan_restaurant: "vegetarian",
};

// Return unique cuisine groups for a place.
export function getCuisineTags(
  types: readonly string[],
): Cuisine[] {
  const cuisines = new Set<Cuisine>();

  for (const type of types) {
    const cuisine = CUISINE_BY_TYPE[type];

    if (cuisine) {
      cuisines.add(cuisine);
    }
  }

  return [...cuisines];
}
