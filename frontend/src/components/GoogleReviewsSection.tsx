import { useUiText } from "../i18n/uiText.ts";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getGoogleReviews,
  type GooglePlaceReviews,
} from "../services/googleReviewService.ts";

import {
  GOOGLE_LIST_EVENT,
  getGoogleList,
  type GoogleListItem,
} from "../services/googleListService.ts";

import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

import "./GoogleReviewsSection.css";

type RequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "rate_limited"
  | "daily_quota_exceeded";

interface ReviewSelection {
  placeId: string;
  name: string;
}

function validPlaceId(value: string): boolean {
  return /^[A-Za-z0-9_-]{5,255}$/.test(value);
}

// Count recurring themes in the returned review texts.
function analyzeThemes(
  texts: string[],
): {
  name: string;
  count: number;
}[] {
  const themes = [
    {
      name: "Comida",
      pattern:
        /\b(comida|sabor|plato|food|taste|delicious)\b/i,
    },
    {
      name: "Servicio",
      pattern:
        /\b(servicio|atenci[oó]n|personal|mesero|service|staff)\b/i,
    },
    {
      name: "Ambiente",
      pattern:
        /\b(ambiente|lugar|m[uú]sica|atmosphere|ambience)\b/i,
    },
    {
      name: "Precio",
      pattern:
        /\b(precio|caro|barato|costoso|price|expensive|cheap)\b/i,
    },
    {
      name: "Espera",
      pattern:
        /\b(espera|demora|lento|r[aá]pido|waiting|slow)\b/i,
    },
  ];

  return themes
    .map((theme) => ({
      name: theme.name,
      count: texts.filter((text) =>
        theme.pattern.test(text)
      ).length,
    }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);
}

export default function GoogleReviewsSection() {
  const ui = useUiText();
  const { t } = useLanguage();

  const [savedPlaces, setSavedPlaces] =
    useState<GoogleListItem[]>([]);

  const [selection, setSelection] =
    useState<ReviewSelection | null>(null);

  const [data, setData] =
    useState<GooglePlaceReviews | null>(null);

  const [status, setStatus] =
    useState<RequestStatus>("idle");

  // Load Google Place IDs saved in SQLite.
  useEffect(() => {
    let active = true;

    function refresh() {
      getGoogleList()
        .then((items) => {
          if (active) {
            setSavedPlaces(items);
          }
        })
        .catch(() => {
          if (active) setSavedPlaces([]);
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
  }, []);

  // Accept restaurant selections from RestaurantList.
  useEffect(() => {
    function handleSelection(event: Event) {
      const detail = (
        event as CustomEvent<ReviewSelection>
      ).detail;

      if (!detail || !validPlaceId(detail.placeId)) {
        return;
      }

      setSelection(detail);
      setData(null);
      setStatus("idle");
    }

    window.addEventListener(
      "foodiefind:review-place",
      handleSelection,
    );

    return () => {
      window.removeEventListener(
        "foodiefind:review-place",
        handleSelection,
      );
    };
  }, []);

  // Request reviews only when the user clicks the button.
  async function loadReviews() {
    if (!selection || status === "loading") {
      return;
    }

    setStatus("loading");
    setData(null);

    try {
      const result = await getGoogleReviews(
        selection.placeId,
      );

      setData(result);
      setStatus("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      setStatus(
        message === "daily_quota_exceeded"
          ? "daily_quota_exceeded"
          : message === "rate_limited"
            ? "rate_limited"
            : "error",
      );
    }
  }

  // Analyze only the review sample actually returned by Google.
  const analysis = useMemo(() => {
    if (!data) return null;

    const rated = data.reviews.filter(
      (review) => review.rating !== null,
    );

    const positive = rated.filter(
      (review) => (review.rating ?? 0) >= 4,
    ).length;

    const neutral = rated.filter(
      (review) => review.rating === 3,
    ).length;

    const negative = rated.filter(
      (review) =>
        (review.rating ?? 0) <= 2,
    ).length;

    const average = rated.length > 0
      ? rated.reduce(
          (sum, review) =>
            sum + (review.rating ?? 0),
          0,
        ) / rated.length
      : null;

    const distribution = [1, 2, 3, 4, 5].map(
      (stars) => ({
        stars,
        count: rated.filter(
          (review) => review.rating === stars,
        ).length,
      }),
    );

    const themes = analyzeThemes(
      data.reviews.map(
        (review) => review.text,
      ),
    );

    // A chronological comparison is possible only when
    // Google supplies enough dated reviews.
    const dated = rated
      .filter(
        (review) =>
          review.publishedAt &&
          Number.isFinite(
            Date.parse(review.publishedAt),
          ),
      )
      .sort(
        (a, b) =>
          Date.parse(a.publishedAt ?? "") -
          Date.parse(b.publishedAt ?? ""),
      );

    let trend:
      | "up"
      | "down"
      | "stable"
      | "unavailable" = "unavailable";

    if (dated.length >= 4) {
      const midpoint = Math.floor(
        dated.length / 2,
      );

      const older = dated.slice(0, midpoint);
      const newer = dated.slice(midpoint);

      const mean = (
        values: typeof dated,
      ): number =>
        values.reduce(
          (sum, review) =>
            sum + (review.rating ?? 0),
          0,
        ) / values.length;

      const difference =
        mean(newer) - mean(older);

      trend =
        difference >= 0.5
          ? "up"
          : difference <= -0.5
            ? "down"
            : "stable";
    }

    return {
      sampleSize: data.reviews.length,
      average,
      positive,
      neutral,
      negative,
      distribution,
      themes,
      trend,
    };
  }, [data]);

  return (
    <section
      className="google-reviews-section"
      id="google-reviews"
    >
      <span className="google-reviews-eyebrow">
        {t("googleReviewsEyebrow")}
      </span>

      <h2>{t("googleReviewsTitle")}</h2>

      <p>
        {ui("ui_select_a_real_restaurant_to_view_it_b375a5b")}
      </p>

      {/* Select a saved restaurant */}
      <label
        htmlFor="reviews-restaurant"
        style={{
          display: "block",
          margin: "16px 0",
        }}
      >
        {ui("ui_selected_restaurant_e89a7e7")}

        <select
          id="reviews-restaurant"
          value={selection?.placeId ?? ""}
          onChange={(event) => {
            const placeId = event.target.value;

            setSelection(
              placeId
                ? {
                    placeId,
                    name: ui("ui_saved_restaurant_db7bcc6"),
                  }
                : null,
            );

            setData(null);
            setStatus("idle");
          }}
          style={{
            display: "block",
            marginTop: "8px",
            width: "100%",
            maxWidth: "420px",
          }}
        >
          <option value="">
            {ui("ui_select_a_restaurant_95f92b9")}
          </option>

          {selection &&
            !savedPlaces.some(
              (item) =>
                item.placeId === selection.placeId,
            ) && (
            <option value={selection.placeId}>
              {selection.name}
            </option>
          )}

          {savedPlaces.map((item) => (
            <option
              key={item.placeId}
              value={item.placeId}
            >
              {ui("ui_saved_restaurant_db7bcc6")}: {item.placeId}
            </option>
          ))}
        </select>
      </label>

      <p>
        {ui("ui_you_can_also_select_analyze_reviews_e7e9658")}
      </p>

      <button
        type="button"
        className="google-reviews-button"
        disabled={
          !selection ||
          status === "loading"
        }
        onClick={() => void loadReviews()}
      >
        {status === "loading"
          ? t("googleReviewsLoading")
          : t("googleReviewsButton")}
      </button>

      {status === "error" && (
        <p role="alert">
          {t("googleReviewsError")}
        </p>
      )}

      {status === "rate_limited" && (
        <p role="alert">
          {t("googleReviewsRateLimited")}
        </p>
      )}

      {status === "daily_quota_exceeded" && (
        <p role="alert">
          {t("placesDailyQuota")}
        </p>
      )}

      {data && analysis && (
        <div className="google-reviews-card">
          <h3>{data.name}</h3>

          <div className="google-reviews-summary">
            <strong>
              {data.rating !== null
                ? `${data.rating.toFixed(1)} / 5`
                : "—"}
            </strong>

            <span>
              {data.ratingCount}{" "}
              {t("googleReviewsCount")}
            </span>
          </div>

          {/* Summary of the displayed reviews */}
          <div className="review-analysis">
            <h3>
              {ui("ui_review_summary_d796c3f")}
            </h3>

            <p>
              {ui("ui_google_reviews_were_analyzed_245137a", { v0: analysis.sampleSize })}
            </p>

            <p>
              {ui("ui_positive_neutral_negative_f19af79", { v0: analysis.positive, v1: analysis.neutral, v2: analysis.negative })}
            </p>

            {analysis.average !== null && (
              <p>
                {ui("ui_sample_average_6332117")}:{" "}
                {analysis.average.toFixed(1)} / 5
              </p>
            )}

            <h4>
              {ui("ui_rating_distribution_20ee965")}
            </h4>

            {analysis.distribution
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item.stars}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    margin: "8px 0",
                  }}
                >
                  <span>
                    {item.stars} ★
                  </span>

                  <div
                    style={{
                      background: "#e6eee8",
                      flex: 1,
                      height: "10px",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "#367554",
                        height: "100%",
                        width: analysis.sampleSize
                          ? `${
                              item.count /
                              analysis.sampleSize *
                              100
                            }%`
                          : "0%",
                      }}
                    />
                  </div>

                  <span>{item.count}</span>
                </div>
              ))}

            <h4>
              {ui("ui_mentioned_topics_f189929")}
            </h4>

            {analysis.themes.length === 0 ? (
              <p>
                {ui("ui_not_enough_topics_were_identified_i_a2a2acf")}
              </p>
            ) : (
              <ul>
                {analysis.themes.map((theme) => (
                  <li key={theme.name}>
                    {theme.name}: {theme.count}
                  </li>
                ))}
              </ul>
            )}

            <h4>
              {ui("ui_indicative_trend_ca1486f")}
            </h4>

            <p>
              {analysis.trend === "up"
                ? ui("ui_newer_reviews_in_this_sample_have_a_a1ecd2c")
                : analysis.trend === "down"
                  ? ui("ui_newer_reviews_in_this_sample_have_a_e2157bb")
                  : analysis.trend === "stable"
                    ? ui("ui_there_is_no_substantial_change_betw_1f22373")
                    : ui("ui_there_are_not_enough_dated_reviews__6667364")}
            </p>

            <small>
              {ui("ui_this_analysis_uses_only_google_sele_bf2febe")}
            </small>
          </div>

          {/* Original external reviews */}
          <h3>
            {ui("ui_original_reviews_2460ac9")}
          </h3>

          {data.reviews.length === 0 ? (
            <p>
              {t("googleReviewsNoComments")}
            </p>
          ) : (
            data.reviews.map((review, index) => (
              <article
                className="google-review-item"
                key={`${data.placeId}-${index}`}
              >
                <div className="google-review-author">
                  {review.authorPhoto && (
                    <img
                      src={review.authorPhoto}
                      alt=""
                      width={36}
                      height={36}
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {review.authorUrl ? (
                    <a
                      href={review.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {review.author}
                    </a>
                  ) : (
                    <strong>
                      {review.author}
                    </strong>
                  )}
                </div>

                {review.rating !== null && (
                  <p>{review.rating} / 5</p>
                )}

                {review.published && (
                  <p>{review.published}</p>
                )}

                <p>{review.text}</p>

                {review.mapsUrl && (
                  <a
                    href={review.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("googleReviewsReviewSource")}
                  </a>
                )}
              </article>
            ))
          )}

          {data.mapsUrl && (
            <a
              className="google-reviews-link"
              href={data.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("googleReviewsOpen")}
            </a>
          )}

          <p className="google-reviews-attribution">
            {t("googleReviewsSource")}{" "}
            Google Maps
          </p>
        </div>
      )}
    </section>
  );
}
