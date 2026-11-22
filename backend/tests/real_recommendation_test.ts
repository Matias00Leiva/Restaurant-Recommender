
import {
  rankRealRestaurants,
  type RealCandidate,
  type RecommendationProfile,
} from "../src/services/realRecommendationService.ts";


import {
  getCuisineTags,
} from "../src/services/cuisineService.ts";


const candidates: RealCandidate[] = [
  {
    placeId: "place_sushi_123",
    name: "Sushi Central",
    distanceKm: 3,
    rating: 4.5,
    ratingCount: 100,
  },
  {
    placeId: "place_pizza_123",
    name: "Pizza Central",
    distanceKm: 3,
    rating: 4.5,
    ratingCount: 100,
  },
];

function emptyProfile(): RecommendationProfile {
  return {
    ratings: [],
    saved: [],
    searches: [],
  };
}

Deno.test("visited restaurants are excluded", () => {
  const profile = emptyProfile();

  profile.saved.push({
    placeId: "place_sushi_123",
    status: "visited",
  });

  const results = rankRealRestaurants(
    candidates,
    profile,
  );

  if (
    results.some(
      (item) => item.placeId === "place_sushi_123",
    )
  ) {
    throw new Error(
      "Visited restaurants should not be recommended",
    );
  }
});

Deno.test("positive personal ratings increase priority", () => {
  const profile = emptyProfile();

  profile.ratings.push({
    placeId: "place_sushi_123",
    rating: 5,
  });

  const results = rankRealRestaurants(
    candidates,
    profile,
  );

  if (results[0]?.placeId !== "place_sushi_123") {
    throw new Error(
      "A highly rated restaurant should rank first",
    );
  }
});

Deno.test("previous searches influence ranking", () => {
  const profile = emptyProfile();

  profile.searches.push({
    search: "sushi",
    category: "",
  });

  const results = rankRealRestaurants(
    candidates,
    profile,
  );

  if (results[0]?.placeId !== "place_sushi_123") {
    throw new Error(
      "Previous searches should influence ranking",
    );
  }
});


Deno.test("Google restaurant types map to cuisine groups", () => {
  const cuisines = getCuisineTags([
    "sushi_restaurant",
    "japanese_restaurant",
    "restaurant",
  ]);

  if (
    cuisines.length !== 1 ||
    cuisines[0] !== "japanese"
  ) {
    throw new Error(
      "Sushi and Japanese types should map to one cuisine",
    );
  }
});

Deno.test("preferred cuisine improves new restaurant ranking", () => {
  const options: RealCandidate[] = [
    {
      placeId: "new_pizza_123",
      name: "Pizza Example",
      distanceKm: 2,
      rating: 4.5,
      ratingCount: 100,
      types: ["pizza_restaurant"],
    },
    {
      placeId: "new_sushi_123",
      name: "Sushi Example",
      distanceKm: 2,
      rating: 4.5,
      ratingCount: 100,
      types: ["sushi_restaurant"],
    },
  ];

  const profile = emptyProfile();

  profile.cuisineWeights = {
    japanese: 6,
  };

  const results = rankRealRestaurants(
    options,
    profile,
  );

  if (results[0]?.placeId !== "new_sushi_123") {
    throw new Error(
      "The preferred cuisine should rank higher",
    );
  }

  if (results[0]?.reason !== "cuisine") {
    throw new Error(
      "Expected a cuisine-based recommendation reason",
    );
  }
});

Deno.test("disliked cuisine receives a ranking penalty", () => {
  const options: RealCandidate[] = [
    {
      placeId: "new_pizza_123",
      name: "Pizza Example",
      distanceKm: 2,
      rating: 4.5,
      ratingCount: 100,
      types: ["pizza_restaurant"],
    },
    {
      placeId: "new_sushi_123",
      name: "Sushi Example",
      distanceKm: 2,
      rating: 4.5,
      ratingCount: 100,
      types: ["sushi_restaurant"],
    },
  ];

  const profile = emptyProfile();

  profile.cuisineWeights = {
    italian: -6,
  };

  const results = rankRealRestaurants(
    options,
    profile,
  );

  if (results[0]?.placeId !== "new_sushi_123") {
    throw new Error(
      "A negatively rated cuisine should rank lower",
    );
  }
});
