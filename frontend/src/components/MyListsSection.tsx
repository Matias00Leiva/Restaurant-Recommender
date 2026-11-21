
import { useEffect, useState } from "react";

import {
  getRestaurants,
  type Restaurant,
} from "../services/restaurantService.ts";

import {
  getUserList,
  updateUserList,
  type ListStatus,
  type UserListItem,
} from "../services/userListService.ts";

import { createListsShareUrl } from "../services/shareService.ts";
import { useLanguage } from "../i18n/LanguageContext.tsx";

export default function MyListsSection() {
  const { t } = useLanguage();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [savedItems, setSavedItems] = useState<UserListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [messageKey, setMessageKey] = useState<
    | "listsError"
    | "listsUpdated"
    | "listsRemoved"
    | "listsUpdateError"
    | "listsLinkCopied"
    | "listsLinkManual"
    | null
  >(null);

  const [shareLink, setShareLink] = useState("");

  // Load restaurants and the current user's lists.
  useEffect(() => {
    let active = true;

    Promise.all([getRestaurants(), getUserList()])
      .then(([catalog, items]) => {
        if (!active) return;

        setRestaurants(catalog);
        setSavedItems(items);
      })
      .catch(() => {
        if (active) setMessageKey("listsError");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Update a restaurant's saved status.
  async function changeStatus(
    restaurantId: string,
    status: ListStatus | null,
  ) {
    setBusy(true);
    setMessageKey(null);

    try {
      await updateUserList(restaurantId, status);
      setSavedItems(await getUserList());
      setShareLink("");

      setMessageKey(
        status === null ? "listsRemoved" : "listsUpdated",
      );
    } catch {
      setMessageKey("listsUpdateError");
    } finally {
      setBusy(false);
    }
  }

  // Get full restaurant information from saved IDs.
  function getSavedRestaurants(status: ListStatus): Restaurant[] {
    return savedItems
      .filter((item) => item.status === status)
      .map((item) =>
        restaurants.find(
          (restaurant) => restaurant.id === item.restaurantId,
        )
      )
      .filter(
        (restaurant): restaurant is Restaurant =>
          restaurant !== undefined,
      );
  }

  // Share a snapshot of both lists.
  async function handleShareLists() {
    const link = createListsShareUrl(savedItems);

    setShareLink(link);

    try {
      await navigator.clipboard.writeText(link);
      setMessageKey("listsLinkCopied");
    } catch {
      setMessageKey("listsLinkManual");
    }
  }

  const toVisit = getSavedRestaurants("to_visit");
  const visited = getSavedRestaurants("visited");

  if (loading) {
    return (
      <section className="my-lists">
        <p>{t("listsLoading")}</p>
      </section>
    );
  }

  return (
    <section className="my-lists" id="mis-listas">
      <span className="section-eyebrow">
        {t("listsEyebrow")}
      </span>

      <h2>{t("listsTitle")}</h2>

      <p>{t("listsDescription")}</p>

      {/* Restaurant selection */}
      <div className="my-lists-editor">
        <select
          aria-label={t("listsSelect")}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">{t("listsSelect")}</option>

          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() => void changeStatus(selectedId, "to_visit")}
        >
          {t("listsToVisit")}
        </button>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() => void changeStatus(selectedId, "visited")}
        >
          {t("listsVisitedAction")}
        </button>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() => void changeStatus(selectedId, null)}
        >
          {t("listsRemove")}
        </button>
      </div>

      {/* Share saved lists */}
      <div className="share-controls">
        <button
          type="button"
          disabled={savedItems.length === 0}
          onClick={() => void handleShareLists()}
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
              onFocus={(event) => event.currentTarget.select()}
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

      {messageKey && (
        <p role="status">{t(messageKey)}</p>
      )}

      <div className="my-lists-grid">
        {/* Restaurants to visit */}
        <div className="saved-list-card">
          <h3>
            {t("listsToVisit")} ({toVisit.length})
          </h3>

          {toVisit.length === 0 ? (
            <p>{t("listsEmptyToVisit")}</p>
          ) : (
            <ul>
              {toVisit.map((restaurant) => (
                <li key={restaurant.id}>
                  <div>
                    <strong>{restaurant.name}</strong>
                    <span>{restaurant.category}</span>
                  </div>

                  <div className="saved-list-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void changeStatus(restaurant.id, "visited")}
                    >
                      {t("listsMarkVisited")}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void changeStatus(restaurant.id, null)}
                    >
                      {t("listsRemove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visited restaurants */}
        <div className="saved-list-card">
          <h3>
            {t("listsVisited")} ({visited.length})
          </h3>

          {visited.length === 0 ? (
            <p>{t("listsEmptyVisited")}</p>
          ) : (
            <ul>
              {visited.map((restaurant) => (
                <li key={restaurant.id}>
                  <div>
                    <strong>{restaurant.name}</strong>
                    <span>{restaurant.category}</span>
                  </div>

                  <div className="saved-list-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void changeStatus(restaurant.id, "to_visit")}
                    >
                      {t("listsToVisit")}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void changeStatus(restaurant.id, null)}
                    >
                      {t("listsRemove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
