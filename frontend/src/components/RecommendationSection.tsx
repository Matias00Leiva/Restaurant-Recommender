
import { useEffect, useState } from "react";

import {
  getRecommendations,
  type RecommendedRestaurant,
} from "../services/recommendationService.ts";

import { useLanguage } from "../i18n/LanguageContext.tsx";

export default function RecommendationSection() {
  const { t } = useLanguage();

  const [restaurants, setRestaurants] = useState<
    RecommendedRestaurant[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    getRecommendations()
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
  }, []);

  // Translate the recommendation explanation.
  function translateReason(reason: string): string {
    switch (reason) {
      case "Coincide con tus calificaciones":
        return t("reasonRatings");

      case "Coincide con tus categorías favoritas":
        return t("reasonCategories");

      case "Relacionado con tus búsquedas":
        return t("reasonSearches");

      case "Se ajusta a tu presupuesto":
        return t("reasonBudget");

      case "Una opción para descubrir":
        return t("reasonDiscover");

      default:
        return t("reasonDiscover");
    }
  }

  // Translate the restaurant category.
  function translateCategory(category: string): string {
    switch (category) {
      case "Japonesa":
        return t("categoryJapanese");

      case "Italiana":
        return t("categoryItalian");

      case "Hamburguesas":
        return t("categoryBurgers");

      default:
        return category;
    }
  }

  return (
    <section className="recommendation-section">
      <span className="section-eyebrow">
        {t("recommendationEyebrow")}
      </span>

      <h2>{t("recommendationTitle")}</h2>

      <p>{t("recommendationDescription")}</p>

      {loading ? (
        <p>{t("recommendationLoading")}</p>
      ) : error ? (
        <p>{t("recommendationError")}</p>
      ) : restaurants.length === 0 ? (
        <p>{t("recommendationEmpty")}</p>
      ) : (
        <div className="recommendation-grid">
          {restaurants.map((restaurant, index) => (
            <article
              className="recommendation-card"
              key={restaurant.id}
            >
              <span className="recommendation-rank">
                #{index + 1} {t("recommendedLabel")}
              </span>

              <h3>{restaurant.name}</h3>

              <p>{translateCategory(restaurant.category)}</p>

              <p>
                {t("estimatedPrice")}:{" "}
                {restaurant.averagePrice.toLocaleString("es-CL", {
                  style: "currency",
                  currency: "CLP",
                  maximumFractionDigits: 0,
                })}
              </p>

              <p className="recommendation-reason">
                {translateReason(restaurant.recommendationReason)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
