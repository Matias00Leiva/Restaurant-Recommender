
import { app } from "../src/app.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: The public catalog returns restaurants.
Deno.test("restaurant catalog returns data", async () => {
  const response = await app(
    new Request("http://localhost:8000/api/restaurants"),
  );

  const data = await response.json();

  assert(response.status === 200, "Expected status 200");
  assert(Array.isArray(data.restaurants), "Expected an array");
  assert(data.restaurants.length > 0, "Catalog is empty");
});

// Test 2: Category and price filters work.
Deno.test("restaurant filters are applied", async () => {
  const response = await app(
    new Request(
      "http://localhost:8000/api/restaurants?category=Japonesa&maxPrice=15000",
    ),
  );

  const data = await response.json();

  assert(response.status === 200, "Expected status 200");

  for (const restaurant of data.restaurants) {
    assert(
      restaurant.category === "Japonesa",
      "Unexpected category",
    );

    assert(
      restaurant.averagePrice <= 15000,
      "Restaurant exceeds the budget",
    );
  }
});

// Test 3: Invalid prices are rejected.
Deno.test("invalid restaurant budget is rejected", async () => {
  const response = await app(
    new Request(
      "http://localhost:8000/api/restaurants?maxPrice=-100",
    ),
  );

  assert(response.status === 400, "Expected status 400");
});

// Test 4: Google Reviews requires authentication.
Deno.test("Google Reviews requires login", async () => {
  const response = await app(
    new Request("http://localhost:8000/api/google-reviews"),
  );

  assert(response.status === 401, "Expected status 401");
});
