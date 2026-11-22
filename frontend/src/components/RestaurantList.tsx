import { useUiText } from "../i18n/uiText.ts";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  getNearbyRestaurants,
  type NearbyRestaurant,
} from "../services/nearbyRestaurantService.ts";

import {
  getGoogleList,
  updateGoogleList,
  GOOGLE_LIST_EVENT,
  type GoogleListItem,
  type GoogleListStatus,
} from "../services/googleListService.ts";

import {
  getGoogleRatings,
  saveGoogleRating,
  GOOGLE_RATING_EVENT,
  type GoogleUserRating,
} from "../services/googleRatingService.ts";

import {
  saveSearchHistory,
} from "../services/activityService.ts";

import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

const PAGE_SIZE = 6;

type SearchStatus =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "error";

type SortOption =
  | "distance"
  | "rating"
  | "reviews";

type BudgetFilter =
  | "all"
  | "low"
  | "medium"
  | "high";

type Cuisine =
  | "japanese"
  | "italian"
  | "burgers"
  | "pizza"
  | "cafe"
  | "other";

// Classify restaurants using Google Places types.
function getCuisine(types: string[] = []): Cuisine {
  if (
    types.some((type) =>
      /japanese|sushi|ramen/.test(type)
    )
  ) {
    return "japanese";
  }

  if (
    types.some((type) =>
      /italian/.test(type)
    )
  ) {
    return "italian";
  }

  if (
    types.some((type) =>
      /hamburger|burger/.test(type)
    )
  ) {
    return "burgers";
  }

  if (
    types.some((type) =>
      /pizza/.test(type)
    )
  ) {
    return "pizza";
  }

  if (
    types.some((type) =>
      /cafe|coffee/.test(type)
    )
  ) {
    return "cafe";
  }

  return "other";
}

// Map Google's price level into budget categories.
function getBudget(
  priceLevel: string | null | undefined,
): Exclude<BudgetFilter, "all"> | null {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return "low";

    case "PRICE_LEVEL_MODERATE":
      return "medium";

    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "high";

    default:
      return null;
  }
}

// Preserve compatible cuisine labels in search history.
function historyCategory(cuisine: string): string {
  switch (cuisine) {
    case "japanese":
      return "Japonesa";
    case "italian":
      return "Italiana";
    case "burgers":
      return "Hamburguesas";
    default:
      return "";
  }
}

export default function RestaurantList() {
  const ui = useUiText();
  const { t, language } = useLanguage();

  const [restaurants, setRestaurants] =
    useState<NearbyRestaurant[]>([]);

  const [radiusKm, setRadiusKm] = useState(20);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [budget, setBudget] =
    useState<BudgetFilter>("all");

  const [appliedSearch, setAppliedSearch] =
    useState("");
  const [appliedCuisine, setAppliedCuisine] =
    useState("");
  const [appliedBudget, setAppliedBudget] =
    useState<BudgetFilter>("all");

  const [sortBy, setSortBy] =
    useState<SortOption>("distance");

  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  const [status, setStatus] =
    useState<SearchStatus>("idle");

  const [error, setError] = useState("");

  const [savedPlaces, setSavedPlaces] =
    useState<GoogleListItem[]>([]);

  const [ratings, setRatings] =
    useState<GoogleUserRating[]>([]);

  const [listBusyId, setListBusyId] =
    useState<string | null>(null);

  const [ratingBusyId, setRatingBusyId] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  const searching =
    status === "locating" ||
    status === "loading";

  // Load and synchronize the user's saved places.
  useEffect(() => {
    let active = true;

    function refresh() {
      getGoogleList()
        .then((items) => {
          if (active) setSavedPlaces(items);
        })
        .catch(() => {
          if (active) {
            setActionError(
              ui("ui_could_not_load_your_lists_78c5ec1"),
            );
          }
        });
    }

    refresh();

    window.addEventListener(
      GOOGLE_LIST_EVENT,
      refresh,
    );

    return () => {
      active = false;
      window.removeEventListener(
        GOOGLE_LIST_EVENT,
        refresh,
      );
    };
  }, [language]);

  // Load and synchronize personal ratings.
  useEffect(() => {
    let active = true;

    function refresh() {
      getGoogleRatings()
        .then((items) => {
          if (active) setRatings(items);
        })
        .catch(() => {
          if (active) {
            setActionError(
              t("personalRatingError"),
            );
          }
        });
    }

    refresh();

    window.addEventListener(
      GOOGLE_RATING_EVENT,
      refresh,
    );

    return () => {
      active = false;
      window.removeEventListener(
        GOOGLE_RATING_EVENT,
        refresh,
      );
    };
  }, [language]);

  // Search Google Places only when requested by the user.
  function findRestaurants() {
    if (searching) return;

    if (!navigator.geolocation) {
      setError(t("nearbyUnsupported"));
      setStatus("error");
      return;
    }

    setRestaurants([]);
    setError("");
    setVisibleCount(PAGE_SIZE);
    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");

        try {
          const results =
            await getNearbyRestaurants(
              position.coords.latitude,
              position.coords.longitude,
              radiusKm,
            );

          setRestaurants(results);
          setStatus("ready");
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "";

          setError(
            message === "daily_quota_exceeded"
              ? t("placesDailyQuota")
              : message === "rate_limited"
                ? t("nearbyRateLimited")
                : message === "not_configured"
                  ? t("nearbyNotConfigured")
                  : t("nearbyFetchError"),
          );

          setStatus("error");
        }
      },
      () => {
        setError(t("nearbyGeoError"));
        setStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  // Apply filters locally; Google is not contacted.
  function applyFilters(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setAppliedCuisine(cuisine);
    setAppliedBudget(budget);
    setVisibleCount(PAGE_SIZE);

    // Keep search history for personalized recommendations.
    if (search.trim() || cuisine) {
      void saveSearchHistory({
        search: search.trim(),
        category: historyCategory(cuisine),
      }).catch(() => {
        console.warn(
          "Could not save restaurant search history.",
        );
      });
    }
  }

  function clearFilters() {
    setSearch("");
    setCuisine("");
    setBudget("all");
    setAppliedSearch("");
    setAppliedCuisine("");
    setAppliedBudget("all");
    setVisibleCount(PAGE_SIZE);
    setSortBy("distance");
  }

  // Save real restaurants in SQLite.
  async function changeList(
    placeId: string,
    nextStatus: GoogleListStatus | null,
  ) {
    if (listBusyId !== null) return;

    setListBusyId(placeId);
    setActionError("");

    try {
      await updateGoogleList(placeId, nextStatus);

      setSavedPlaces((previous) => [
        ...previous.filter(
          (item) => item.placeId !== placeId,
        ),
        ...(nextStatus === null
          ? []
          : [{ placeId, status: nextStatus }]),
      ]);
    } catch {
      setActionError(
        t("listsUpdateError"),
      );
    } finally {
      setListBusyId(null);
    }
  }

  // Save a personal rating, separate from Google ratings.
  async function changeRating(
    placeId: string,
    rating: number | null,
  ) {
    if (ratingBusyId !== null) return;

    setRatingBusyId(placeId);
    setActionError("");

    try {
      await saveGoogleRating(placeId, rating);

      setRatings((previous) => [
        ...previous.filter(
          (item) => item.placeId !== placeId,
        ),
        ...(rating === null
          ? []
          : [{ placeId, rating }]),
      ]);
    } catch {
      setActionError(
        t("personalRatingError"),
      );
    } finally {
      setRatingBusyId(null);
    }
  }

  // Select this restaurant in the Google Reviews section.
  function inspectReviews(
    restaurant: NearbyRestaurant,
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "foodiefind:review-place",
        {
          detail: {
            placeId: restaurant.placeId,
            name: restaurant.name,
          },
        },
      ),
    );

    document
      .getElementById("google-reviews")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  async function shareRestaurant(
    restaurant: NearbyRestaurant,
  ) {
    try {
      await navigator.clipboard.writeText(
        restaurant.mapsUrl,
      );

      setCopiedId(restaurant.placeId);
    } catch {
      setActionError(
        ui("ui_could_not_copy_the_link_you_can_ope_39d31f8"),
      );
    }
  }

  const filteredRestaurants = useMemo(() => {
    const query = appliedSearch.toLocaleLowerCase();

    const result = restaurants.filter((restaurant) => {
      const matchesName =
        !query ||
        restaurant.name
          .toLocaleLowerCase()
          .includes(query) ||
        restaurant.address
          .toLocaleLowerCase()
          .includes(query);

      const matchesCuisine =
        !appliedCuisine ||
        getCuisine(restaurant.types) ===
          appliedCuisine;

      // Unknown prices are excluded only when filtering.
      const matchesBudget =
        appliedBudget === "all" ||
        getBudget(restaurant.priceLevel) ===
          appliedBudget;

      return (
        matchesName &&
        matchesCuisine &&
        matchesBudget
      );
    });

    result.sort((a, b) => {
      if (sortBy === "rating") {
        return (
          (b.rating ?? -1) -
            (a.rating ?? -1) ||
          b.ratingCount - a.ratingCount
        );
      }

      if (sortBy === "reviews") {
        return (
          b.ratingCount - a.ratingCount ||
          (b.rating ?? -1) -
            (a.rating ?? -1)
        );
      }

      return a.distanceKm - b.distanceKm;
    });

    return result;
  }, [
    restaurants,
    appliedSearch,
    appliedCuisine,
    appliedBudget,
    sortBy,
  ]);

  const visibleRestaurants =
    filteredRestaurants.slice(0, visibleCount);

  const hasMore =
    visibleCount < filteredRestaurants.length;

  const cuisineLabel = (types: string[] = []) => {
    switch (getCuisine(types)) {
      case "japanese":
        return t("categoryJapanese");
      case "italian":
        return t("categoryItalian");
      case "burgers":
        return t("categoryBurgers");
      case "pizza":
        return "Pizza";
      case "cafe":
        return ui("ui_cafe_0d5f2e7");
      default:
        return ui("ui_restaurant_1212ea9");
    }
  };

  const budgetLabel = (
    priceLevel: string | null | undefined,
  ) => {
    const value = getBudget(priceLevel);

    if (value === "low") {
      return ui("ui_inexpensive_7c17332");
    }

    if (value === "medium") {
      return ui("ui_moderate_5c42afc");
    }

    if (value === "high") {
      return ui("ui_expensive_7c6d115");
    }

    return ui("ui_price_unavailable_6a9e657");
  };

  return (
    <section
      className="restaurant-list"
      id="catalogo-real"
    >
      <h2>
        {ui("ui_explore_new_flavors_9ac91f0")}
      </h2>

      <p>
        {ui("ui_find_restaurants_near_you_discover__9eac3a9")}
      </p>

      {/* Local restaurant filters */}
      <form
        className="restaurant-filters"
        onSubmit={applyFilters}
      >
        <input
          type="search"
          value={search}
          placeholder={t("restaurantSearch")}
          aria-label={t("restaurantSearch")}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          aria-label={t("restaurantAllCategories")}
          value={cuisine}
          onChange={(event) =>
            setCuisine(event.target.value)
          }
        >
          <option value="">
            {t("restaurantAllCategories")}
          </option>
          <option value="japanese">
            {t("categoryJapanese")}
          </option>
          <option value="italian">
            {t("categoryItalian")}
          </option>
          <option value="burgers">
            {t("categoryBurgers")}
          </option>
          <option value="pizza">Pizza</option>
          <option value="cafe">
            {ui("ui_cafe_0d5f2e7")}
          </option>
          <option value="other">
            {ui("ui_other_f97e9da")}
          </option>
        </select>

        {/* Budget filter based on Google's price levels */}
        <select
          aria-label={ui("ui_budget_1c6225e")}
          value={budget}
          onChange={(event) =>
            setBudget(
              event.target.value as BudgetFilter,
            )
          }
        >
          <option value="all">
            {ui("ui_all_budgets_edaa7af")}
          </option>
          <option value="low">
            {ui("ui_inexpensive_7c17332")}
          </option>
          <option value="medium">
            {ui("ui_moderate_5c42afc")}
          </option>
          <option value="high">
            {ui("ui_expensive_7c6d115")}
          </option>
        </select>

        <button type="submit">
          {t("restaurantApplyFilters")}
        </button>

        <button
          type="button"
          onClick={clearFilters}
        >
          {t("restaurantClearFilters")}
        </button>
      </form>

      {/* Search distance */}
      <div
        className="location-controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          margin: "18px 0",
        }}
      >
        <label htmlFor="restaurant-radius">
          {t("nearbyRadius")}
        </label>

        <select
          id="restaurant-radius"
          value={radiusKm}
          disabled={searching}
          onChange={(event) => {
            setRadiusKm(
              Number(event.target.value),
            );
            setRestaurants([]);
            setVisibleCount(PAGE_SIZE);
            setStatus("idle");
          }}
        >
          {[3, 10, 20, 50].map((radius) => (
            <option key={radius} value={radius}>
              {radius} km
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={searching}
          onClick={findRestaurants}
        >
          {status === "locating"
            ? t("nearbyLocating")
            : status === "loading"
              ? t("nearbyLoading")
              : ui("ui_find_restaurants_6b9bea9")}
        </button>
      </div>

      {status === "idle" && (
        <p>
          {ui("ui_choose_a_search_radius_to_discover__0a71e49")}
        </p>
      )}

      {status === "error" && (
        <p role="alert">{error}</p>
      )}

      {actionError && (
        <p role="alert">{actionError}</p>
      )}

      {status === "ready" &&
        filteredRestaurants.length === 0 && (
          <p role="status">
            {t("restaurantEmpty")}
          </p>
        )}

      {status === "ready" &&
        filteredRestaurants.length > 0 && (
          <>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <p role="status">
                {ui("ui_showing_of_restaurants_ae39abe", { v0: visibleRestaurants.length, v1: filteredRestaurants.length })}
              </p>

              <label>
                {t("nearbySortLabel")}{" "}
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(
                      event.target.value as SortOption,
                    );
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  <option value="distance">
                    {t("nearbySortDistance")}
                  </option>
                  <option value="rating">
                    {t("nearbySortRating")}
                  </option>
                  <option value="reviews">
                    {t("nearbySortReviews")}
                  </option>
                </select>
              </label>
            </div>

            {visibleRestaurants.map((restaurant) => {
              const savedStatus =
                savedPlaces.find(
                  (item) =>
                    item.placeId ===
                      restaurant.placeId,
                )?.status;

              const personalRating =
                ratings.find(
                  (item) =>
                    item.placeId ===
                      restaurant.placeId,
                )?.rating;

              return (
                <article
                  className="restaurant-card"
                  key={restaurant.placeId}
                >
                  <div
                    className="restaurant-media"
                    aria-hidden="true"
                  >
                    <span>
                      {getCuisine(restaurant.types) ===
                          "japanese"
                        ? "🍣"
                        : getCuisine(restaurant.types) ===
                            "burgers"
                          ? "🍔"
                          : "🍽️"}
                    </span>
                  </div>

                  <h3>{restaurant.name}</h3>
                  <p>
                    {cuisineLabel(restaurant.types)}
                  </p>
                  <p>{restaurant.address}</p>

                  <p>
                    {t("nearbyDistance")}:{" "}
                    {restaurant.distanceKm.toFixed(1)} km
                  </p>

                  <p>
                    {ui("ui_price_level_5a7c378")}:{" "}
                    {budgetLabel(
                      restaurant.priceLevel,
                    )}
                  </p>

                  <p>
                    {restaurant.rating === null
                      ? t("nearbyNoRatings")
                      : `Google: ${restaurant.rating.toFixed(1)}/5 (${restaurant.ratingCount})`}
                  </p>

                  {/* FoodieFind personal rating */}
                  <label>
                    <strong>
                      {t("personalRatingLabel")}
                    </strong>

                    <select
                      value={personalRating ?? ""}
                      disabled={ratingBusyId !== null}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        void changeRating(
                          restaurant.placeId,
                          value === ""
                            ? null
                            : Number(value),
                        );
                      }}
                    >
                      <option value="">
                        {t("personalRatingNone")}
                      </option>

                      {[1, 2, 3, 4, 5].map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value} / 5
                        </option>
                      ))}
                    </select>
                  </label>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <button
                      type="button"
                      disabled={listBusyId !== null}
                      aria-pressed={
                        savedStatus === "to_visit"
                      }
                      onClick={() =>
                        void changeList(
                          restaurant.placeId,
                          "to_visit",
                        )
                      }
                    >
                      {t("listsToVisit")}
                    </button>

                    <button
                      type="button"
                      disabled={listBusyId !== null}
                      aria-pressed={
                        savedStatus === "visited"
                      }
                      onClick={() =>
                        void changeList(
                          restaurant.placeId,
                          "visited",
                        )
                      }
                    >
                      {t("listsVisitedAction")}
                    </button>

                    {savedStatus && (
                      <button
                        type="button"
                        disabled={listBusyId !== null}
                        onClick={() =>
                          void changeList(
                            restaurant.placeId,
                            null,
                          )
                        }
                      >
                        {t("listsRemove")}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <a
                      href={restaurant.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("restaurantMapOpen")}
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        inspectReviews(restaurant)
                      }
                    >
                      {ui("ui_analyze_reviews_a2612ff")}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void shareRestaurant(restaurant)
                      }
                    >
                      {t("restaurantShareButton")}
                    </button>
                  </div>

                  {copiedId === restaurant.placeId && (
                    <p role="status">
                      {t("restaurantShareCopied")}
                    </p>
                  )}
                </article>
              );
            })}

            {hasMore && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "center",
                  margin: "20px 0",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((previous) =>
                      Math.min(
                        previous + PAGE_SIZE,
                        filteredRestaurants.length,
                      )
                    )
                  }
                >
                  {ui("ui_show_more_restaurants_60dd54f")}
                </button>
              </div>
            )}

            <p
              style={{
                gridColumn: "1 / -1",
              }}
            >
              {t("nearbyAttribution")} Google Maps.
            </p>
          </>
        )}
    </section>
  );
}
