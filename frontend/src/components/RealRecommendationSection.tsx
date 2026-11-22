
import { useState } from "react";

import {
  getNearbyRestaurants,
} from "../services/nearbyRestaurantService.ts";

import {
  getRealRecommendations,
  type RealRecommendedRestaurant,
  type RealRecommendationReason,
} from "../services/realRecommendationService.ts";

import { useLanguage } from "../i18n/LanguageContext.tsx";

import "./RealRecommendationSection.css";

type Status =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "error";

type ErrorKey =
  | "realRecUnsupported"
  | "realRecGeoError"
  | "realRecFetchError"
  | "realRecRateLimited"
  | "realRecNotConfigured"
  | "placesDailyQuota";

const reasonKeys: Record<
  RealRecommendationReason,
  | "realRecReasonPersonal"
  | "realRecReasonCuisine"
  | "realRecReasonSaved"
  | "realRecReasonSearch"
  | "realRecReasonPopular"
  | "realRecReasonNearby"
> = {
  personal: "realRecReasonPersonal",
  cuisine: "realRecReasonCuisine",
  saved: "realRecReasonSaved",
  search: "realRecReasonSearch",
  popular: "realRecReasonPopular",
  nearby: "realRecReasonNearby",
};

export default function RealRecommendationSection() {
  const { t } = useLanguage();

  const [radiusKm, setRadiusKm] = useState(20);

  const [restaurants, setRestaurants] =
    useState<RealRecommendedRestaurant[]>([]);

  const [status, setStatus] =
    useState<Status>("idle");

  const [errorKey, setErrorKey] =
    useState<ErrorKey | null>(null);

  const searching =
    status === "locating" ||
    status === "loading";

  // Generate recommendations on user request.
  function findRecommendations() {
    if (searching) return;

    if (!navigator.geolocation) {
      setErrorKey("realRecUnsupported");
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
          const nearby =
            await getNearbyRestaurants(
              position.coords.latitude,
              position.coords.longitude,
              radiusKm,
            );

          if (nearby.length === 0) {
            setRestaurants([]);
            setStatus("ready");
            return;
          }

          const recommendations =
            await getRealRecommendations(nearby);

          setRestaurants(recommendations);
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
                ? "realRecRateLimited"
                : message === "not_configured"
                  ? "realRecNotConfigured"
                  : "realRecFetchError",
          );

          setStatus("error");
        }
      },
      () => {
        setErrorKey("realRecGeoError");
        setStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <section
      className="real-recommendation-section"
      id="recomendaciones-reales"
    >
      <span className="section-eyebrow">
        {t("realRecEyebrow")}
      </span>

      <h2>{t("realRecTitle")}</h2>

      <p>{t("realRecDescription")}</p>

      {/* Search controls */}
      <div className="real-rec-controls">
        <label htmlFor="real-rec-radius">
          {t("realRecRadius")}
        </label>

        <select
          id="real-rec-radius"
          value={radiusKm}
          disabled={searching}
          onChange={(event) => {
            setRadiusKm(Number(event.target.value));
            setRestaurants([]);
            setErrorKey(null);
            setStatus("idle");
          }}
        >
          {[3, 10, 20, 50].map((value) => (
            <option
              key={value}
              value={value}
            >
              {value} km
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={searching}
          onClick={findRecommendations}
        >
          {status === "locating"
            ? t("realRecLocating")
            : status === "loading"
              ? t("realRecLoading")
              : t("realRecButton")}
        </button>
      </div>

      {/* Search errors */}
      {status === "error" && errorKey && (
        <p className="real-rec-error" role="alert">
          {t(errorKey)}
        </p>
      )}

      {/* No recommendations found */}
      {status === "ready" &&
        restaurants.length === 0 && (
          <p role="status">
            {t("realRecEmpty")}
          </p>
        )}

      {/* Personalized restaurant results */}
      {status === "ready" &&
        restaurants.length > 0 && (
          <>
            <p role="status">
              {t("realRecResults")}:{" "}
              {restaurants.length}
            </p>

            <div className="real-rec-grid">
              {restaurants.map(
                (restaurant, index) => (
                  <article
                    className="real-rec-card"
                    key={restaurant.placeId}
                  >
                    <span className="real-rec-rank">
                      #{index + 1}{" "}
                      {t("recommendedLabel")}
                    </span>

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

                    {/* Personalized recommendation reason */}
                    <p className="real-rec-reason">
                      {t(
                        reasonKeys[
                          restaurant.recommendationReason
                        ],
                      )}
                    </p>

                    <a
                      href={restaurant.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("nearbyOpenMaps")}
                    </a>
                  </article>
                ),
              )}
            </div>

            <p className="real-rec-attribution">
              {t("realRecSource")}{" "}
              <strong translate="no">
                Google Maps
              </strong>
            </p>
          </>
        )}
    </section>
  );
}
