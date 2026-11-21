
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getRestaurants,
  type Restaurant,
  type RestaurantFilters,
} from "../services/restaurantService.ts";

import {
  getSearchHistory,
  rateRestaurant,
  saveSearchHistory,
  type SearchHistoryItem,
} from "../services/activityService.ts";

import {
  createRestaurantShareUrl,
} from "../services/shareService.ts";

import { useLanguage } from "../i18n/LanguageContext.tsx";

interface Coordinates {
  latitude: number;
  longitude: number;
}

type MessageKey =
  | "restaurantHistoryError"
  | "restaurantGeoLoading"
  | "restaurantGeoSuccess"
  | "restaurantGeoError"
  | "restaurantGeoUnsupported"
  | "restaurantRatingSaved"
  | "restaurantRatingError";

function calculateDistance(
  first: Coordinates,
  second: Coordinates,
): number {
  const toRadians = (value: number) => value * Math.PI / 180;

  const latDifference = toRadians(second.latitude - first.latitude);
  const lonDifference = toRadians(second.longitude - first.longitude);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(lonDifference / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export default function RestaurantList() {
  const { t } = useLanguage();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [messageKey, setMessageKey] = useState<MessageKey | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [filters, setFilters] = useState<RestaurantFilters>({});

  const [location, setLocation] = useState<Coordinates | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const [shareFeedback, setShareFeedback] = useState<{
    restaurantId: string;
    copied: boolean;
    url: string;
  } | null>(null);

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load restaurants when filters change.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    getRestaurants(filters)
      .then((data) => {
        if (active) setRestaurants(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  // Load the user's recent searches.
  useEffect(() => {
    let active = true;

    getSearchHistory()
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch(() => {
        if (active) setHistory([]);
      });

    return () => {
      active = false;
    };
  }, []);

  // Translate a category without changing its database value.
  function translateCategory(value: string): string {
    switch (value) {
      case "Japonesa":
        return t("categoryJapanese");
      case "Italiana":
        return t("categoryItalian");
      case "Hamburguesas":
        return t("categoryBurgers");
      default:
        return value;
    }
  }

  // Translate the descriptions of the demo restaurants.
  function translateDescription(value: string): string {
    switch (value) {
      case "Restaurante especializado en hamburguesas.":
        return t("descriptionBurgers");
      case "Restaurante especializado en comida italiana.":
        return t("descriptionItalian");
      case "Restaurante especializado en sushi y comida japonesa.":
        return t("descriptionJapanese");
      default:
        return value;
    }
  }

  // Apply filters and save the search history.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessageKey(null);

    const nextFilters: RestaurantFilters = {
      search: search.trim(),
      category,
      maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
    };

    setFilters(nextFilters);

    if (
      nextFilters.search ||
      nextFilters.category ||
      nextFilters.maxPrice !== undefined
    ) {
      try {
        await saveSearchHistory(nextFilters);
        setHistory(await getSearchHistory());
      } catch {
        setMessageKey("restaurantHistoryError");
      }
    }
  }

  // Request permission to access the user's location.
  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessageKey("restaurantGeoUnsupported");
      return;
    }

    setMessageKey("restaurantGeoLoading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setNearbyOnly(true);
        setMessageKey("restaurantGeoSuccess");
      },
      () => {
        setMessageKey("restaurantGeoError");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  // Save a restaurant rating.
  async function handleRating(
    restaurantId: string,
    rating: number,
  ) {
    try {
      await rateRestaurant(restaurantId, rating);
      setRestaurants(await getRestaurants(filters));
      setMessageKey("restaurantRatingSaved");
    } catch {
      setMessageKey("restaurantRatingError");
    }
  }

  // Copy a shareable restaurant link.
  async function handleShareRestaurant(restaurantId: string) {
    const link = createRestaurantShareUrl(restaurantId);

    try {
      await navigator.clipboard.writeText(link);

      setShareFeedback({
        restaurantId,
        copied: true,
        url: link,
      });
    } catch {
      setShareFeedback({
        restaurantId,
        copied: false,
        url: link,
      });
    }
  }

  const visibleRestaurants = restaurants
    .map((restaurant) => ({
      ...restaurant,
      distanceKm: location
        ? calculateDistance(location, restaurant)
        : null,
    }))
    .filter(
      (restaurant) =>
        !nearbyOnly ||
        (restaurant.distanceKm !== null && restaurant.distanceKm <= 20),
    )
    .sort((a, b) => {
      if (location) {
        return (a.distanceKm ?? Infinity) -
          (b.distanceKm ?? Infinity);
      }

      return a.name.localeCompare(b.name);
    });

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant.id === selectedMapId,
  );

  const mapQuery = selectedRestaurant
    ? `${selectedRestaurant.latitude},${selectedRestaurant.longitude}`
    : "";

  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <section className="restaurant-list">
      <h2>{t("restaurantsTitle")}</h2>

      {/* Search filters */}
      <form
        className="restaurant-filters"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder={t("restaurantSearch")}
          aria-label={t("restaurantSearch")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label={t("restaurantHistoryCategory")}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">
            {t("restaurantAllCategories")}
          </option>

          <option value="Japonesa">
            {t("categoryJapanese")}
          </option>

          <option value="Hamburguesas">
            {t("categoryBurgers")}
          </option>

          <option value="Italiana">
            {t("categoryItalian")}
          </option>
        </select>

        <input
          type="number"
          min="0"
          step="1"
          placeholder={t("restaurantMaxPrice")}
          aria-label={t("restaurantMaxPrice")}
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />

        <button type="submit">
          {t("restaurantApplyFilters")}
        </button>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategory("");
            setMaxPrice("");
            setFilters({});
          }}
        >
          {t("restaurantClearFilters")}
        </button>
      </form>

      {/* Geolocation controls */}
      <div className="location-controls">
        <button type="button" onClick={useMyLocation}>
          {t("restaurantNearby")}
        </button>

        {location && (
          <button
            type="button"
            onClick={() => setNearbyOnly(!nearbyOnly)}
          >
            {nearbyOnly
              ? t("restaurantShowAll")
              : t("restaurantShowNearby")}
          </button>
        )}
      </div>

      {messageKey && (
        <p role="status">{t(messageKey)}</p>
      )}

      {/* Restaurant cards */}
      {loading ? (
        <p>{t("restaurantLoading")}</p>
      ) : error ? (
        <p>{t("restaurantError")}</p>
      ) : visibleRestaurants.length === 0 ? (
        <p>{t("restaurantEmpty")}</p>
      ) : (
        visibleRestaurants.map((restaurant) => (
          <article
            className="restaurant-card"
            key={restaurant.id}
          >
            <div className="restaurant-media">
              {restaurant.imageUrl ? (
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  loading="lazy"
                />
              ) : (
                <span aria-hidden="true">
                  {restaurant.category === "Japonesa"
                    ? "🍣"
                    : restaurant.category === "Hamburguesas"
                    ? "🍔"
                    : restaurant.category === "Italiana"
                    ? "🍝"
                    : "🍽️"}
                </span>
              )}
            </div>

            <h3>{restaurant.name}</h3>

            <p>{translateCategory(restaurant.category)}</p>

            <p>{translateDescription(restaurant.description)}</p>

            <p>{restaurant.address}</p>

            <p>
              {t("estimatedPrice")}:{" "}
              {restaurant.averagePrice.toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0,
              })}
            </p>

            {restaurant.distanceKm !== null && (
              <p>
                {t("restaurantDistance")}:{" "}
                {restaurant.distanceKm.toFixed(1)} km
              </p>
            )}

            <p>
              {restaurant.averageRating === null
                ? t("restaurantNoRatings")
                : `${t("restaurantRating")}: ${restaurant.averageRating}/5 (${restaurant.ratingCount} ${
                  restaurant.ratingCount === 1
                    ? t("restaurantRatingUser")
                    : t("restaurantRatingUsers")
                })`}
            </p>

            {/* Rating selector */}
            <label>
              {t("restaurantYourRating")}:

              <select
                defaultValue=""
                aria-label={`${t("restaurantYourRating")} ${restaurant.name}`}
                onChange={(event) => {
                  void handleRating(
                    restaurant.id,
                    Number(event.target.value),
                  );
                }}
              >
                <option value="" disabled>
                  {t("restaurantSelect")}
                </option>

                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}{" "}
                    {value === 1
                      ? t("restaurantStar")
                      : t("restaurantStars")}
                  </option>
                ))}
              </select>
            </label>

            {/* Google Maps */}
            <button
              type="button"
              onClick={() => setSelectedMapId(restaurant.id)}
            >
              {t("restaurantMapButton")}
            </button>

            {/* Share restaurant */}
            <button
              type="button"
              className="share-restaurant-button"
              onClick={() => void handleShareRestaurant(restaurant.id)}
            >
              {t("restaurantShareButton")}
            </button>

            {shareFeedback?.restaurantId === restaurant.id && (
              <div className="share-feedback" role="status">
                {shareFeedback.copied ? (
                  <>
                    <strong>{t("restaurantShareCopied")}</strong>
                    <p>{t("restaurantShareCopiedHint")}</p>
                  </>
                ) : (
                  <>
                    <strong>{t("restaurantShareReady")}</strong>
                    <p>{t("restaurantShareManual")}</p>

                    <input
                      type="text"
                      readOnly
                      value={shareFeedback.url}
                      aria-label={t("restaurantShareReady")}
                      onFocus={(event) =>
                        event.currentTarget.select()}
                    />
                  </>
                )}

                <a
                  href={shareFeedback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("restaurantShareOpen")}
                </a>
              </div>
            )}
          </article>
        ))
      )}

      {/* Restaurant map */}
      {selectedRestaurant && (
        <section className="restaurant-map">
          <h3>
            {t("restaurantMapTitle")} {selectedRestaurant.name}
          </h3>

          {mapsKey ? (
            <iframe
              title={`${t("restaurantMapTitle")} ${selectedRestaurant.name}`}
              src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsKey)}&q=${encodeURIComponent(mapQuery)}`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <p>{t("restaurantMapMissing")}</p>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("restaurantMapOpen")}
          </a>
        </section>
      )}

      {/* Search history */}
      <section className="search-history">
        <h3>{t("restaurantHistory")}</h3>

        {history.length === 0 ? (
          <p>{t("restaurantHistoryEmpty")}</p>
        ) : (
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                {[
                  item.search &&
                    `${t("restaurantHistoryName")}: ${item.search}`,
                  item.category &&
                    `${t("restaurantHistoryCategory")}: ${
                      translateCategory(item.category)
                    }`,
                  item.maxPrice !== null &&
                    `${t("restaurantHistoryBudget")} $${item.maxPrice.toLocaleString("es-CL")}`,
                ].filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
