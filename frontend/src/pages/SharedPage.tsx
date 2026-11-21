import { useEffect, useState } from "react";

import {
  getRestaurants,
  type Restaurant,
} from "../services/restaurantService.ts";

import { useLanguage } from "../i18n/LanguageContext.tsx";

// Read restaurant IDs from the shared URL.
function readIds(value: string | null): string[] {
  return [...new Set(
    (value ?? "")
      .split(",")
      .filter((id) => /^[a-zA-Z0-9-]{1,100}$/.test(id)),
  )].slice(0, 30);
}

export default function SharedPage() {
  const { t } = useLanguage();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const params = new URLSearchParams(window.location.search);

  const restaurantId = params.get("restaurant");
  const visitedIds = readIds(params.get("visited"));
  const toVisitIds = readIds(params.get("toVisit"));

  const isSharedList =
    params.has("visited") || params.has("toVisit");

  // Load the public restaurant catalog.
  useEffect(() => {
    let active = true;

    getRestaurants()
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

  // Translate stored restaurant categories.
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

  // Translate descriptions for the demo restaurants.
  function translateDescription(description: string): string {
    switch (description) {
      case "Restaurante especializado en hamburguesas.":
        return t("descriptionBurgers");
      case "Restaurante especializado en comida italiana.":
        return t("descriptionItalian");
      case "Restaurante especializado en sushi y comida japonesa.":
        return t("descriptionJapanese");
      default:
        return description;
    }
  }

  const selectedRestaurant = restaurants.find(
    (item) => item.id === restaurantId,
  );

  const visited = restaurants.filter(
    (item) => visitedIds.includes(item.id),
  );

  const toVisit = restaurants.filter(
    (item) => toVisitIds.includes(item.id),
  );

  function renderRestaurant(restaurant: Restaurant) {
    return (
      <article className="shared-restaurant" key={restaurant.id}>
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
      </article>
    );
  }

  return (
    <main className="shared-page">
      <header className="shared-header">
        <a className="brand" href="/">
          <span className="brand-symbol">F</span>
          <span>FoodieFind</span>
        </a>

        <a className="shared-home-link" href="/">
          {t("sharedHome")}
        </a>
      </header>

      <div className="shared-content">
        {loading ? (
          <p>{t("sharedLoading")}</p>
        ) : error ? (
          <p>{t("sharedError")}</p>
        ) : restaurantId ? (
          <>
            <span className="section-eyebrow">
              {t("sharedRestaurantEyebrow")}
            </span>

            <h1>{t("sharedRestaurantTitle")}</h1>

            {selectedRestaurant ? (
              renderRestaurant(selectedRestaurant)
            ) : (
              <p>{t("sharedRestaurantMissing")}</p>
            )}
          </>
        ) : isSharedList ? (
          <>
            <span className="section-eyebrow">
              {t("sharedListsEyebrow")}
            </span>

            <h1>{t("sharedListsTitle")}</h1>

            <p>{t("sharedListsDescription")}</p>

            <div className="shared-list-grid">
              <section className="shared-list-group">
                <h2>
                  {t("listsToVisit")} ({toVisit.length})
                </h2>

                {toVisit.length === 0 ? (
                  <p>{t("sharedEmptyList")}</p>
                ) : (
                  toVisit.map(renderRestaurant)
                )}
              </section>

              <section className="shared-list-group">
                <h2>
                  {t("listsVisited")} ({visited.length})
                </h2>

                {visited.length === 0 ? (
                  <p>{t("sharedEmptyList")}</p>
                ) : (
                  visited.map(renderRestaurant)
                )}
              </section>
            </div>
          </>
        ) : (
          <p>{t("sharedInvalidLink")}</p>
        )}

        <p className="shared-disclaimer">
          {t("sharedDisclaimer")}
        </p>
      </div>
    </main>
  );
}
