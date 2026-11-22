
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

import { useLanguage } from "../i18n/LanguageContext.tsx";

import "./NearbyRestaurantsSection.css";

// Component status.
type Status =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "error";

// Available sorting options.
type SortOption = "distance" | "rating" | "reviews";

// Error translation keys.
type ErrorKey =
  | "nearbyUnsupported"
  | "nearbyGeoError"
  | "nearbyFetchError"
  | "nearbyNotConfigured"
  | "nearbyRateLimited";

export default function NearbyRestaurantsSection() {
  const { t } = useLanguage();

  // Search configuration.
  const [radiusKm, setRadiusKm] = useState(20);
  const [sortBy, setSortBy] =
    useState<SortOption>("distance");

  // Search results and request state.
  const [restaurants, setRestaurants] =
    useState<NearbyRestaurant[]>([]);

  const [status, setStatus] =
    useState<Status>("idle");

  const [errorKey, setErrorKey] =
    useState<ErrorKey | null>(null);

  // Saved Google restaurants.
  const [savedGooglePlaces, setSavedGooglePlaces] =
    useState<GoogleListItem[]>([]);

  const [busyPlaceId, setBusyPlaceId] =
    useState<string | null>(null);

  const [listLoading, setListLoading] =
    useState(true);

  const [listError, setListError] =
    useState(false);

 
// Keep saved places synchronized across components.
useEffect(() => {
  let active = true;

  function refreshSavedPlaces() {
    getGoogleList()
      .then((items) => {
        if (!active) return;

        setSavedGooglePlaces(items);
        setListError(false);
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


  // Update the radius without making an API request.
  function updateRadius(value: number) {
    setRadiusKm(value);
    setRestaurants([]);
    setErrorKey(null);
    setStatus("idle");
  }

  // Request the user's location and search restaurants.
  function findNearby() {
    if (
      status === "locating" ||
      status === "loading"
    ) {
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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");

        try {
          const data = await getNearbyRestaurants(
            position.coords.latitude,
            position.coords.longitude,
            radiusKm,
          );

          setRestaurants(data);
          setStatus("ready");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "";

          if (message === "rate_limited") {
            setErrorKey("nearbyRateLimited");
          } else if (message === "not_configured") {
            setErrorKey("nearbyNotConfigured");
          } else {
            setErrorKey("nearbyFetchError");
          }

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

  // Save, update, or remove a Google restaurant.
  async function saveGoogleRestaurant(
    placeId: string,
    nextStatus: GoogleListStatus | null,
  ) {
    if (busyPlaceId !== null || listLoading) {
      return;
    }

    setBusyPlaceId(placeId);
    setListError(false);

    try {
      await updateGoogleList(placeId, nextStatus);

      // Update the interface after a successful request.
      setSavedGooglePlaces((previous) => {
        const remaining = previous.filter(
          (item) => item.placeId !== placeId,
        );

        if (nextStatus === null) {
          return remaining;
        }

        return [
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

  // Sort restaurants without another API request.
  const sortedRestaurants = [...restaurants].sort(
    (a, b) => {
      if (sortBy === "rating") {
        return (
          (b.rating ?? -1) - (a.rating ?? -1) ||
          b.ratingCount - a.ratingCount ||
          a.distanceKm - b.distanceKm
        );
      }

      if (sortBy === "reviews") {
        return (
          b.ratingCount - a.ratingCount ||
          (b.rating ?? -1) - (a.rating ?? -1) ||
          a.distanceKm - b.distanceKm
        );
      }

      return a.distanceKm - b.distanceKm;
    },
  );

  const searching =
    status === "locating" ||
    status === "loading";

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

      {/* Search radius selector */}
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
            updateRadius(Number(event.target.value))
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
              radiusKm === value ? "active" : ""
            }
            aria-pressed={radiusKm === value}
            disabled={searching}
            onClick={() => updateRadius(value)}
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

      {/* Search errors */}
      {status === "error" && errorKey && (
        <p
          className="nearby-error"
          role="alert"
        >
          {t(errorKey)}
        </p>
      )}

      {/* Saved list errors */}
      {listError && (
        <p
          className="nearby-error"
          role="alert"
        >
          {t("nearbySaveError")}
        </p>
      )}

      {/* Empty results */}
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

            {/* Sorting options */}
            <div className="nearby-sort-control">
              <label htmlFor="nearby-sort">
                {t("nearbySortLabel")}
              </label>

              <select
                id="nearby-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
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

            {/* Restaurant cards */}
            <div className="nearby-grid">
              {sortedRestaurants.map((restaurant) => {
                const savedStatus =
                  savedGooglePlaces.find(
                    (item) =>
                      item.placeId === restaurant.placeId,
                  )?.status;

                return (
                  <article
                    className="nearby-card"
                    key={restaurant.placeId}
                  >
                    <h3>{restaurant.name}</h3>

                    <p>{restaurant.address}</p>

                    {/* Distance */}
                    <p>
                      {t("nearbyDistance")}:{" "}
                      {restaurant.distanceKm.toFixed(1)} km
                    </p>

                    {/* Google rating */}
                    <p>
                      {restaurant.rating !== null
                        ? `${restaurant.rating.toFixed(1)} / 5 · ${restaurant.ratingCount} ${t("nearbyRatings")}`
                        : t("nearbyNoRatings")}
                    </p>

                    {/* Google Maps link */}
                    <a
                      href={restaurant.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("nearbyOpenMaps")}
                    </a>

                    {/* Saved restaurant actions */}
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
