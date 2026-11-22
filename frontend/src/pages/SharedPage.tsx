import { useUiText } from "../i18n/uiText.ts";

import {
  useLanguage,
} from "../i18n/LanguageContext.tsx";

// Validate Google Place IDs included in a public URL.
function readGoogleIds(
  value: string | null,
): string[] {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .filter((id) =>
          /^[A-Za-z0-9_-]{5,255}$/.test(id)
        ),
    ),
  ].slice(0, 30);
}

// Build a Google Maps URL without a paid API request.
function mapsUrlFromId(placeId: string): string {
  const url = new URL(
    "https://www.google.com/maps/search/",
  );

  url.searchParams.set("api", "1");
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("query_place_id", placeId);

  return url.toString();
}

export default function SharedPage() {
  const ui = useUiText();
  const { t } = useLanguage();

  const params = new URLSearchParams(
    window.location.search,
  );

  const toVisit = readGoogleIds(
    params.get("gToVisit"),
  );

  const visited = readGoogleIds(
    params.get("gVisited"),
  );

  const hasSharedList =
    params.has("gToVisit") ||
    params.has("gVisited");

  function renderPlaces(
    placeIds: string[],
    title: string,
  ) {
    return (
      <section className="shared-list-group">
        <h2>
          {title} ({placeIds.length})
        </h2>

        {placeIds.length === 0 ? (
          <p>{t("sharedEmptyList")}</p>
        ) : (
          placeIds.map((placeId, index) => (
            <article
              className="shared-restaurant"
              key={placeId}
            >
              <h3>
                {t("sharedGooglePlace")}{" "}
                #{index + 1}
              </h3>

              <p>Google Maps</p>

              <a
                href={mapsUrlFromId(placeId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("sharedGoogleOpen")}
              </a>
            </article>
          ))
        )}
      </section>
    );
  }

  return (
    <main className="shared-page">
      <header className="shared-header">
        <a className="brand" href="/">
          <span className="brand-symbol">
            F
          </span>
          <span>FoodieFind</span>
        </a>

        <a
          className="shared-home-link"
          href="/"
        >
          {t("sharedHome")}
        </a>
      </header>

      <div className="shared-content">
        {hasSharedList ? (
          <>
            <span className="section-eyebrow">
              {t("sharedListsEyebrow")}
            </span>

            <h1>{t("sharedListsTitle")}</h1>

            <p>
              {ui("ui_restaurant_list_shared_from_foodief_9b54067")}
            </p>

            <div className="shared-list-grid">
              {renderPlaces(
                toVisit,
                t("listsToVisit"),
              )}

              {renderPlaces(
                visited,
                t("listsVisited"),
              )}
            </div>

            <p className="shared-disclaimer">
              {ui("ui_links_open_the_real_restaurant_list_24fb5a1")}
            </p>
          </>
        ) : (
          <p>{t("sharedInvalidLink")}</p>
        )}
      </div>
    </main>
  );
}
