
import { useEffect, useState } from "react";

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

import { useLanguage } from "../i18n/LanguageContext.tsx";

import "./NearbyRestaurantsSection.css";

// Number of restaurants displayed initially.
const INITIAL_VISIBLE_COUNT = 6;

// Number of additional restaurants shown per click.
const LOAD_MORE_COUNT = 6;

type Status =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "error";

type SortOption =
  | "distance"
  | "rating"
  | "reviews";

type ErrorKey =
  | "nearbyUnsupported"
  | "nearbyGeoError"
  | "nearbyFetchError"
  | "nearbyNotConfigured"
  | "nearbyRateLimited"
  | "placesDailyQuota";

export default function NearbyRestaurantsSection() {
  const { t, language } = useLanguage();

  // Search settings.
  const [radiusKm, setRadiusKm] = useState(20);

  const [sortBy, setSortBy] =
    useState<SortOption>("distance");

  const [restaurants, setRestaurants] =
    useState<NearbyRestaurant[]>([]);

  const [status, setStatus] =
    useState<Status>("idle");

  const [errorKey, setErrorKey] =
    useState<ErrorKey | null>(null);

  // Pagination state.
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_COUNT,
  );

  // Saved restaurants.
  const [savedGooglePlaces, setSavedGooglePlaces] =
    useState<GoogleListItem[]>([]);

  const [busyPlaceId, setBusyPlaceId] =
    useState<string | null>(null);

  const [listLoading, setListLoading] =
    useState(true);

  const [listError, setListError] =
    useState(false);

  // Personal restaurant ratings.
  const [personalRatings, setPersonalRatings] =
    useState<GoogleUserRating[]>([]);

  const [ratingsLoading, setRatingsLoading] =
    useState(true);

  const [ratingBusyId, setRatingBusyId] =
    useState<string | null>(null);

  const [ratingError, setRatingError] =
    useState(false);

  const [ratingMessage, setRatingMessage] =
    useState(false);

  // Synchronize saved restaurants across components.
  useEffect(() => {
    let active = true;

    function refreshSavedPlaces() {
      getGoogleList()
        .then((items) => {
          if (active) {
            setSavedGooglePlaces(items);
            setListError(false);
          }
        })
        .catch(() => {
          if (active) {
            setListError(true);
          }
        })
        .finally(() => {
          if (active) {
            setListLoading(false);
          }
        });
    }

    refreshSavedPlaces();

    window.addEventListener(
      GOOGLE_LIST_EVENT,
      refreshSavedPlaces,
    );

    return () => {
      active = false;

      window.removeEventListener(
        GOOGLE_LIST_EVENT,
        refreshSavedPlaces,
      );
    };
  }, []);

  // Synchronize personal ratings across components.
  useEffect(() => {
    let active = true;

    function refreshRatings() {
      getGoogleRatings()
        .then((items) => {
          if (active) {
            setPersonalRatings(items);
            setRatingError(false);
          }
        })
        .catch(() => {
          if (active) {
            setRatingError(true);
          }
        })
        .finally(() => {
          if (active) {
            setRatingsLoading(false);
          }
        });
    }

    refreshRatings();

    window.addEventListener(
      GOOGLE_RATING_EVENT,
      refreshRatings,
    );

    return () => {
      active = false;

      window.removeEventListener(
        GOOGLE_RATING_EVENT,
        refreshRatings,
      );
    };
  }, []);

  // Update the search radius and reset the results.
  function updateRadius(value: number) {
    setRadiusKm(value);
    setRestaurants([]);
    setStatus("idle");
    setErrorKey(null);

    // Reset pagination after changing the radius.
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const searching =
    status === "locating" ||
    status === "loading";

  // Request restaurants using the user's location.
  function findNearby() {
    if (searching) {
      return;
    }

    if (!navigator.geolocation) {
      setErrorKey("nearbyUnsupported");
      setStatus("error");
      return;
    }

    setRestaurants([]);
    setErrorKey(null);
    setStatus("locating");

    // Every new search starts with six visible restaurants.
    setVisibleCount(INITIAL_VISIBLE_COUNT);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");

        try {
          const results = await getNearbyRestaurants(
            position.coords.latitude,
            position.coords.longitude,
            radiusKm,
          );

          setRestaurants(results);
          setStatus("ready");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "";

          setErrorKey(
            message === "daily_quota_exceeded"
              ? "placesDailyQuota"
              : message === "rate_limited"
                ? "nearbyRateLimited"
                : message === "not_configured"
                  ? "nearbyNotConfigured"
                  : "nearbyFetchError",
          );

          setStatus("error");
        }
      },
      () => {
        setErrorKey("nearbyGeoError");
        setStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  // Save a real restaurant in SQLite.
  async function saveGoogleRestaurant(
    placeId: string,
    nextStatus: GoogleListStatus | null,
  ) {
    if (
      busyPlaceId !== null ||
      listLoading
    ) {
      return;
    }

    setBusyPlaceId(placeId);
    setListError(false);

    try {
      await updateGoogleList(placeId, nextStatus);

      setSavedGooglePlaces((previous) => {
        const remaining = previous.filter(
          (item) => item.placeId !== placeId,
        );

        return nextStatus === null
          ? remaining
          : [
              ...remaining,
              {
                placeId,
                status: nextStatus,
              },
            ];
      });
    } catch {
      setListError(true);
    } finally {
      setBusyPlaceId(null);
    }
  }

  // Save a personal FoodieFind rating.
  async function rateGoogleRestaurant(
    placeId: string,
    rating: number | null,
  ) {
    if (
      ratingBusyId !== null ||
      ratingsLoading
    ) {
      return;
    }

    setRatingBusyId(placeId);
    setRatingError(false);
    setRatingMessage(false);

    try {
      await saveGoogleRating(placeId, rating);

      setPersonalRatings((previous) => {
        const remaining = previous.filter(
          (item) => item.placeId !== placeId,
        );

        return rating === null
          ? remaining
          : [
              ...remaining,
              {
                placeId,
                rating,
              },
            ];
      });

      setRatingMessage(true);
    } catch {
      setRatingError(true);
    } finally {
      setRatingBusyId(null);
    }
  }

  // Sort the restaurants locally.
  const sortedRestaurants = [
    ...restaurants,
  ].sort((a, b) => {
    if (sortBy === "rating") {
      return (
        (b.rating ?? -1) -
          (a.rating ?? -1) ||
        b.ratingCount - a.ratingCount ||
        a.distanceKm - b.distanceKm
      );
    }

    if (sortBy === "reviews") {
      return (
        b.ratingCount - a.ratingCount ||
        (b.rating ?? -1) -
          (a.rating ?? -1) ||
        a.distanceKm - b.distanceKm
      );
    }

    return a.distanceKm - b.distanceKm;
  });

  // Only render the currently visible restaurants.
  const visibleRestaurants =
    sortedRestaurants.slice(0, visibleCount);

  // Check if there are more restaurants to display.
  const hasMoreRestaurants =
    visibleCount < sortedRestaurants.length;

  const remainingRestaurants = Math.max(
    0,
    sortedRestaurants.length - visibleCount,
  );

  // Display more restaurants without calling Google Places.
  function showMoreRestaurants() {
    setVisibleCount((previous) =>
      Math.min(
        previous + LOAD_MORE_COUNT,
        sortedRestaurants.length,
      )
    );
  }

  // Change sorting without requesting new restaurants.
  function changeSorting(value: SortOption) {
    setSortBy(value);

    // Start from the first six results in the new order.
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  return (
    <section
      className="nearby-section"
      id="restaurantes-reales"
    >
      <span className="section-eyebrow">
        {t("nearbyEyebrow")}
      </span>

      <h2>{t("nearbyTitle")}</h2>

      <p>{t("nearbyDescription")}</p>

      {/* Search radius control */}
      <div className="nearby-radius-control">
        <label htmlFor="nearby-radius">
          <span>{t("nearbyRadius")}</span>
          <strong>{radiusKm} km</strong>
        </label>

        <input
          id="nearby-radius"
          type="range"
          min="1"
          max="50"
          step="1"
          value={radiusKm}
          disabled={searching}
          onChange={(event) =>
            updateRadius(
              Number(event.target.value),
            )
          }
        />

        <div
          className="nearby-radius-scale"
          aria-hidden="true"
        >
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Quick radius selection */}
      <div className="nearby-radius-presets">
        {[3, 10, 20, 50].map((value) => (
          <button
            key={value}
            type="button"
            className={
              radiusKm === value
                ? "active"
                : ""
            }
            aria-pressed={radiusKm === value}
            disabled={searching}
            onClick={() =>
              updateRadius(value)
            }
          >
            {value} km
          </button>
        ))}
      </div>

      {/* Search button */}
      <button
        type="button"
        className="nearby-search-button"
        disabled={searching}
        onClick={findNearby}
      >
        {status === "locating"
          ? t("nearbyLocating")
          : status === "loading"
            ? t("nearbyLoading")
            : t("nearbyButton")}
      </button>

      {/* Error messages */}
      {status === "error" && errorKey && (
        <p
          className="nearby-error"
          role="alert"
        >
          {t(errorKey)}
        </p>
      )}

      {listError && (
        <p
          className="nearby-error"
          role="alert"
        >
          {t("nearbySaveError")}
        </p>
      )}

      {ratingError && (
        <p
          className="nearby-error"
          role="alert"
        >
          {t("personalRatingError")}
        </p>
      )}

      {ratingMessage && !ratingError && (
        <p role="status">
          {t("personalRatingSaved")}
        </p>
      )}

      {/* No restaurants found */}
      {status === "ready" &&
        restaurants.length === 0 && (
          <p role="status">
            {t("nearbyEmpty")}
          </p>
        )}

      {/* Restaurant results */}
      {status === "ready" &&
        restaurants.length > 0 && (
          <>
            <p
              className="nearby-result-count"
              role="status"
            >
              {t("nearbyResults")}:{" "}
              {restaurants.length}
            </p>

            {/* Sort restaurants */}
            <div className="nearby-sort-control">
              <label htmlFor="nearby-sort">
                {t("nearbySortLabel")}
              </label>

              <select
                id="nearby-sort"
                value={sortBy}
                onChange={(event) =>
                  changeSorting(
                    event.target.value as SortOption,
                  )
                }
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
            </div>

            {/* Visible restaurant count */}
            <p
              className="nearby-visible-count"
              role="status"
              aria-live="polite"
            >
              {language === "es"
                ? `Mostrando ${visibleRestaurants.length} de ${sortedRestaurants.length} restaurantes`
                : `Showing ${visibleRestaurants.length} of ${sortedRestaurants.length} restaurants`}
            </p>

            {/* Restaurant cards */}
            <div className="nearby-grid">
              {visibleRestaurants.map((restaurant) => {
                const savedStatus =
                  savedGooglePlaces.find(
                    (item) =>
                      item.placeId ===
                        restaurant.placeId,
                  )?.status;

                const personalRating =
                  personalRatings.find(
                    (item) =>
                      item.placeId ===
                        restaurant.placeId,
                  )?.rating;

                return (
                  <article
                    className="nearby-card"
                    key={restaurant.placeId}
                  >
                    <h3>{restaurant.name}</h3>

                    <p>{restaurant.address}</p>

                    <p>
                      {t("nearbyDistance")}:{" "}
                      {restaurant.distanceKm.toFixed(1)} km
                    </p>

                    {/* Public Google rating */}
                    <p>
                      {restaurant.rating !== null
                        ? `${restaurant.rating.toFixed(1)} / 5 · ${restaurant.ratingCount} ${t("nearbyRatings")}`
                        : t("nearbyNoRatings")}
                    </p>

                    {/* Personal rating */}
                    <div className="nearby-personal-rating">
                      <label
                        htmlFor={`rating-${restaurant.placeId}`}
                      >
                        {t("personalRatingLabel")}
                      </label>

                      <select
                        id={`rating-${restaurant.placeId}`}
                        value={personalRating ?? ""}
                        disabled={
                          ratingsLoading ||
                          ratingBusyId !== null
                        }
                        onChange={(event) => {
                          const value =
                            event.target.value;

                          void rateGoogleRestaurant(
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

                        {[1, 2, 3, 4, 5].map(
                          (value) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {value} / 5
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    {/* Google Maps link */}
                    <a
                      href={restaurant.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("nearbyOpenMaps")}
                    </a>

                    {/* Save restaurant actions */}
                    <div className="nearby-save-actions">
                      <button
                        type="button"
                        className={
                          savedStatus === "to_visit"
                            ? "selected"
                            : ""
                        }
                        aria-pressed={
                          savedStatus === "to_visit"
                        }
                        disabled={
                          listLoading ||
                          busyPlaceId !== null
                        }
                        onClick={() =>
                          void saveGoogleRestaurant(
                            restaurant.placeId,
                            "to_visit",
                          )
                        }
                      >
                        {t("listsToVisit")}
                      </button>

                      <button
                        type="button"
                        className={
                          savedStatus === "visited"
                            ? "selected"
                            : ""
                        }
                        aria-pressed={
                          savedStatus === "visited"
                        }
                        disabled={
                          listLoading ||
                          busyPlaceId !== null
                        }
                        onClick={() =>
                          void saveGoogleRestaurant(
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
                          disabled={
                            listLoading ||
                            busyPlaceId !== null
                          }
                          onClick={() =>
                            void saveGoogleRestaurant(
                              restaurant.placeId,
                              null,
                            )
                          }
                        >
                          {t("listsRemove")}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Show more restaurants */}
            {hasMoreRestaurants && (
              <div
                className="nearby-show-more"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "24px",
                  marginBottom: "24px",
                }}
              >
                <button
                  type="button"
                  className="nearby-search-button"
                  onClick={showMoreRestaurants}
                >
                  {language === "es"
                    ? `Ver más restaurantes (+${Math.min(LOAD_MORE_COUNT, remainingRestaurants)})`
                    : `Show more restaurants (+${Math.min(LOAD_MORE_COUNT, remainingRestaurants)})`}
                </button>
              </div>
            )}

            {/* Google attribution */}
            <p className="nearby-attribution">
              {t("nearbyAttribution")}{" "}
              <strong translate="no">
                Google Maps
              </strong>
              {" · "}
              {t("nearbyLimitations")}
            </p>
          </>
        )}
    </section>
  );
}
