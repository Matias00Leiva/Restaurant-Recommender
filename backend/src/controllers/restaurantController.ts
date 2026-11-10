import { getAllRestaurants } from "../repositories/restaurantRepository.ts";

export function listRestaurants(request: Request): Response {
  const params = new URL(request.url).searchParams;

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const maxPriceText = params.get("maxPrice");

  let maxPrice: number | undefined;

  if (maxPriceText !== null) {
    maxPrice = Number(maxPriceText);

    if (
      maxPriceText.trim() === "" ||
      !Number.isSafeInteger(maxPrice) ||
      maxPrice < 0
    ) {
      return Response.json(
        { error: "invalid_max_price" },
        { status: 400 },
      );
    }
  }

  const restaurants = getAllRestaurants({
    search,
    category,
    maxPrice,
  });

  return Response.json({ restaurants });
}