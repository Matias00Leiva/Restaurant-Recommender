import { useUiText } from "../i18n/uiText.ts";

import { useEffect, useState } from "react";

import {
  GOOGLE_LIST_EVENT,
  getGoogleList,
  getSavedGoogleRestaurants,
  updateGoogleList,
  type GoogleListItem,
  type GoogleListStatus,
  type SavedGoogleRestaurant,
} from "../services/googleListService.ts";

import {
  GOOGLE_RATING_EVENT,
  getGoogleRatings,
  saveGoogleRating,
  type GoogleUserRating,
} from "../services/googleRatingService.ts";

import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

import "./MyListsExtras.css";

// Open a real restaurant directly in Google Maps.
function mapsUrlFromId(placeId: string): string {
  const url = new URL(
    "https://www.google.com/maps/search/",
  );

  url.searchParams.set("api", "1");
  url.searchParams.set(
    "query",
    "restaurant",
  );
  url.searchParams.set(
    "query_place_id",
    placeId,
  );

  return url.toString();
}

export default function MyListsSection() {
  const ui = useUiText();
  const { t, language } = useLanguage();

  const [items, setItems] =
    useState<GoogleListItem[]>([]);

  const [details, setDetails] =
    useState<SavedGoogleRestaurant[]>([]);

  const [ratings, setRatings] =
    useState<GoogleUserRating[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const [ratingBusyId, setRatingBusyId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [shareLink, setShareLink] =
    useState("");

  // Retrieve saved Google restaurants from SQLite.
  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const saved = await getGoogleList();

        if (!active) return;

        setItems(saved);

        // Details are optional; keep saved IDs when Google
        // cannot return details because of its daily quota.
        if (saved.length > 0) {
          try {
            const result =
              await getSavedGoogleRestaurants();

            if (active) setDetails(result);
          } catch {
            if (active) setDetails([]);
          }
        } else {
          setDetails([]);
        }
      } catch {
        if (active) {
          setMessage(
            t("listsError"),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh();

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

  // Retrieve personal restaurant ratings from SQLite.
  useEffect(() => {
    let active = true;

    function refresh() {
      getGoogleRatings()
        .then((result) => {
          if (active) setRatings(result);
        })
        .catch(() => {
          if (active) {
            setMessage(t("personalRatingError"));
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

  // Change a restaurant's list status.
  async function changeStatus(
    placeId: string,
    status: GoogleListStatus | null,
  ) {
    if (busyId !== null) return;

    setBusyId(placeId);
    setMessage("");

    try {
      await updateGoogleList(placeId, status);

      setItems((previous) => [
        ...previous.filter(
          (item) => item.placeId !== placeId,
        ),
        ...(status === null
          ? []
          : [{ placeId, status }]),
      ]);

      setShareLink("");

      setMessage(
        status === null
          ? t("listsRemoved")
          : t("listsUpdated"),
      );
    } catch {
      setMessage(t("listsUpdateError"));
    } finally {
      setBusyId(null);
    }
  }

  // Save the user's private FoodieFind rating.
  async function changeRating(
    placeId: string,
    rating: number | null,
  ) {
    if (ratingBusyId !== null) return;

    setRatingBusyId(placeId);
    setMessage("");

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

      setMessage(t("personalRatingSaved"));
    } catch {
      setMessage(t("personalRatingError"));
    } finally {
      setRatingBusyId(null);
    }
  }

  // Share real Google Place IDs without exposing user data.
  async function shareLists() {
    const url = new URL(
      "/share",
      window.location.origin,
    );

    url.searchParams.set(
      "gVisited",
      items
        .filter(
          (item) => item.status === "visited",
        )
        .map((item) => item.placeId)
        .join(","),
    );

    url.searchParams.set(
      "gToVisit",
      items
        .filter(
          (item) => item.status === "to_visit",
        )
        .map((item) => item.placeId)
        .join(","),
    );

    const link = url.toString();

    setShareLink(link);

    try {
      await navigator.clipboard.writeText(link);
      setMessage(t("listsLinkCopied"));
    } catch {
      setMessage(t("listsLinkManual"));
    }
  }

  function renderList(
    status: GoogleListStatus,
  ) {
    const restaurants = items.filter(
      (item) => item.status === status,
    );

    return (
      <div className="saved-list-card">
        <h3>
          {status === "visited"
            ? t("listsVisited")
            : t("listsToVisit")}{" "}
          ({restaurants.length})
        </h3>

        {restaurants.length === 0 ? (
          <p>
            {status === "visited"
              ? t("listsEmptyVisited")
              : t("listsEmptyToVisit")}
          </p>
        ) : (
          <ul>
            {restaurants.map((restaurant) => {
              const info = details.find(
                (item) =>
                  item.placeId ===
                    restaurant.placeId,
              );

              const rating = ratings.find(
                (item) =>
                  item.placeId ===
                    restaurant.placeId,
              );

              return (
                <li key={restaurant.placeId}>
                  <div>
                    <strong>
                      {info?.name ??
                        t("listsGoogleUnavailable")}
                    </strong>

                    <span>
                      {info?.address ??
                        restaurant.placeId}
                    </span>

                    <a
                      className="saved-google-link"
                      href={
                        info?.mapsUrl ??
                        mapsUrlFromId(
                          restaurant.placeId,
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("restaurantMapOpen")}
                    </a>
                  </div>

                  <div className="saved-personal-rating">
                    <label
                      htmlFor={`saved-rating-${restaurant.placeId}`}
                    >
                      {t("personalRatingLabel")}
                    </label>

                    <select
                      id={`saved-rating-${restaurant.placeId}`}
                      value={rating?.rating ?? ""}
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
                  </div>

                  <div className="saved-list-actions">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void changeStatus(
                          restaurant.placeId,
                          status === "visited"
                            ? "to_visit"
                            : "visited",
                        )
                      }
                    >
                      {status === "visited"
                        ? t("listsToVisit")
                        : t("listsMarkVisited")}
                    </button>

                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void changeStatus(
                          restaurant.placeId,
                          null,
                        )
                      }
                    >
                      {t("listsRemove")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <section
      className="my-lists"
      id="mis-listas"
    >
      <span className="section-eyebrow">
        {t("listsEyebrow")}
      </span>

      <h2>{t("listsTitle")}</h2>

      <p>
        {ui("ui_organize_your_favorite_restaurants__a4421a5")}
      </p>

      {loading ? (
        <p>{t("listsLoading")}</p>
      ) : (
        <>
          {message && (
            <p role="status">
              {message}
            </p>
          )}

          <div className="my-lists-grid">
            {renderList("to_visit")}
            {renderList("visited")}
          </div>

          <div className="share-controls">
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() =>
                void shareLists()
              }
            >
              {t("listsShare")}
            </button>

            {shareLink && (
              <div className="share-result">
                <label htmlFor="share-url">
                  {t("listsShareUrl")}
                </label>

                <input
                  id="share-url"
                  type="text"
                  readOnly
                  value={shareLink}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                />

                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("listsOpenLink")}
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
