
import { useState } from "react";

import {
  getGoogleReviews,
  type GooglePlaceReviews,
} from "../services/googleReviewService.ts";

import { useLanguage } from "../i18n/LanguageContext.tsx";

import "./GoogleReviewsSection.css";

type RequestState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "rate_limited";

export default function GoogleReviewsSection() {
  const { t } = useLanguage();

  const [data, setData] = useState<GooglePlaceReviews | null>(null);
  const [status, setStatus] = useState<RequestState>("idle");

  // Request Google data only after the user clicks the button.
  async function loadReviews() {
    if (status === "loading" || status === "success") {
      return;
    }

    setStatus("loading");

    try {
      const result = await getGoogleReviews();
      setData(result);
      setStatus("success");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "rate_limited"
      ) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
    }
  }

  return (
    <section className="google-reviews-section">
      <span className="google-reviews-eyebrow">
        {t("googleReviewsEyebrow")}
      </span>

      <h2>{t("googleReviewsTitle")}</h2>

      <p>{t("googleReviewsDescription")}</p>

      {!data && (
        <button
          type="button"
          className="google-reviews-button"
          disabled={status === "loading"}
          onClick={() => void loadReviews()}
        >
          {status === "loading"
            ? t("googleReviewsLoading")
            : t("googleReviewsButton")}
        </button>
      )}

      {status === "error" && (
        <p role="alert">{t("googleReviewsError")}</p>
      )}

      {status === "rate_limited" && (
        <p role="alert">{t("googleReviewsRateLimited")}</p>
      )}

      {data && (
        <div className="google-reviews-card">
          <h3>{data.name}</h3>

          <div className="google-reviews-summary">
            <strong>
              {data.rating !== null
                ? `${data.rating.toFixed(1)} / 5`
                : "—"}
            </strong>

            <span>
              {data.ratingCount.toLocaleString("es-CL")}{" "}
              {t("googleReviewsCount")}
            </span>
          </div>

          {data.reviews.length === 0 ? (
            <p>{t("googleReviewsNoComments")}</p>
          ) : (
            <>
              <p className="google-reviews-note">
                {t("googleReviewsOrder")}
              </p>

              {data.reviews.map((review, index) => (
                <article
                  className="google-review-item"
                  key={index}
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
                      <strong>{review.author}</strong>
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
              ))}
            </>
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
            <span className="GMP-attribution" translate="no">
              Google Maps
            </span>
          </p>

          <p className="google-reviews-note">
            {t("googleReviewsPolicy")}
          </p>
        </div>
      )}
    </section>
  );
}
