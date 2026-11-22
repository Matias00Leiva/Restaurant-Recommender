
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

import {
  getSavedGoogleRestaurants,
  updateGoogleList,
  GOOGLE_LIST_EVENT,
  type GoogleListChangeDetail,
  type SavedGoogleRestaurant,
} from "../services/googleListService.ts";

import { createListsShareUrl } from "../services/shareService.ts";
import { useLanguage } from "../i18n/LanguageContext.tsx";

type MessageKey =
  | "listsError"
  | "listsUpdated"
  | "listsRemoved"
  | "listsUpdateError"
  | "listsLinkCopied"
  | "listsLinkManual";

export default function MyListsSection() {
  const { t } = useLanguage();

  // Restaurants stored in the original catalog.
  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [savedItems, setSavedItems] =
    useState<UserListItem[]>([]);

  // Real restaurants stored by Google Place ID.
  const [googleItems, setGoogleItems] =
    useState<SavedGoogleRestaurant[]>([]);

  const [selectedId, setSelectedId] = useState("");

  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] =
    useState(true);

  const [googleError, setGoogleError] =
    useState(false);

  const [busy, setBusy] = useState(false);

  const [messageKey, setMessageKey] =
    useState<MessageKey | null>(null);

  const [shareLink, setShareLink] = useState("");

  // Load the original restaurant catalog and user lists.
  useEffect(() => {
    let active = true;

    Promise.all([getRestaurants(), getUserList()])
      .then(([catalog, items]) => {
        if (!active) return;

        setRestaurants(catalog);
        setSavedItems(items);
      })
      .catch(() => {
        if (active) {
          setMessageKey("listsError");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Load Google restaurant details and listen for updates.
  useEffect(() => {
    let active = true;

    getSavedGoogleRestaurants()
      .then((items) => {
        if (active) {
          setGoogleItems(items);
        }
      })
      .catch(() => {
        if (active) {
          setGoogleError(true);
        }
      })
      .finally(() => {
        if (active) {
          setGoogleLoading(false);
        }
      });

    function handleGoogleListChange(event: Event) {
      const { placeId, status } = (
        event as CustomEvent<GoogleListChangeDetail>
      ).detail;

      // Remove a restaurant immediately from the list.
      if (status === null) {
        setGoogleItems((previous) =>
          previous.filter(
            (item) => item.placeId !== placeId,
          )
        );
        return;
      }

      // Retrieve the updated restaurant from the backend.
      getSavedGoogleRestaurants(placeId)
        .then((items) => {
          if (!active || !items[0]) return;

          const updated = items[0];

          setGoogleItems((previous) => [
            ...previous.filter(
              (item) => item.placeId !== placeId,
            ),
            updated,
          ]);

          setGoogleError(false);
        })
        .catch(() => {
          if (active) {
            setGoogleError(true);
          }
        });
    }

    window.addEventListener(
      GOOGLE_LIST_EVENT,
      handleGoogleListChange,
    );

    return () => {
      active = false;

      window.removeEventListener(
        GOOGLE_LIST_EVENT,
        handleGoogleListChange,
      );
    };
  }, []);

  // Update the status of a demo restaurant.
  async function changeStatus(
    restaurantId: string,
    status: ListStatus | null,
  ) {
    if (busy) return;

    setBusy(true);
    setMessageKey(null);

    try {
      await updateUserList(restaurantId, status);
      setSavedItems(await getUserList());
      setShareLink("");

      setMessageKey(
        status === null
          ? "listsRemoved"
          : "listsUpdated",
      );
    } catch {
      setMessageKey("listsUpdateError");
    } finally {
      setBusy(false);
    }
  }

  // Update a real restaurant saved by Google Place ID.
  async function changeGoogleStatus(
    placeId: string,
    status: ListStatus | null,
  ) {
    if (busy) return;

    setBusy(true);
    setMessageKey(null);

    try {
      await updateGoogleList(placeId, status);

      setMessageKey(
        status === null
          ? "listsRemoved"
          : "listsUpdated",
      );
    } catch {
      setMessageKey("listsUpdateError");
    } finally {
      setBusy(false);
    }
  }

  // Match saved demo IDs with their catalog records.
  function getSavedRestaurants(
    status: ListStatus,
  ): Restaurant[] {
    return savedItems
      .filter((item) => item.status === status)
      .map((item) =>
        restaurants.find(
          (restaurant) =>
            restaurant.id === item.restaurantId,
        )
      )
      .filter(
        (restaurant): restaurant is Restaurant =>
          restaurant !== undefined,
      );
  }

  // Share the original catalog list snapshot.
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

  // Render both real and demo restaurants in the same list.
  function renderSavedList(status: ListStatus) {
    const demoRestaurants =
      getSavedRestaurants(status);

    const realRestaurants = googleItems.filter(
      (item) => item.status === status,
    );

    const total =
      demoRestaurants.length + realRestaurants.length;

    return (
      <div className="saved-list-card">
        <h3>
          {status === "visited"
            ? t("listsVisited")
            : t("listsToVisit")} ({total})
        </h3>

        {total === 0 && !googleLoading ? (
          <p>
            {status === "visited"
              ? t("listsEmptyVisited")
              : t("listsEmptyToVisit")}
          </p>
        ) : (
          <ul>
            {/* Real restaurants from Google */}
            {realRestaurants.map((restaurant) => (
              <li key={`google-${restaurant.placeId}`}>
                <div>
                  <strong>
                    {restaurant.name ??
                      t("listsGoogleUnavailable")}
                  </strong>

                  <span>
                    {restaurant.address ??
                      restaurant.placeId}
                  </span>

                  <span>
                    {t("listsGoogleSource")}
                  </span>

                  <a
                    className="saved-google-link"
                    href={restaurant.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("restaurantMapOpen")}
                  </a>
                </div>

                <div className="saved-list-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void changeGoogleStatus(
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
                    disabled={busy}
                    onClick={() =>
                      void changeGoogleStatus(
                        restaurant.placeId,
                        null,
                      )
                    }
                  >
                    {t("listsRemove")}
                  </button>
                </div>
              </li>
            ))}

            {/* Original demo restaurants */}
            {demoRestaurants.map((restaurant) => (
              <li key={`demo-${restaurant.id}`}>
                <div>
                  <strong>{restaurant.name}</strong>
                  <span>{restaurant.category}</span>
                  <span>{t("listsDemoSource")}</span>
                </div>

                <div className="saved-list-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void changeStatus(
                        restaurant.id,
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
                    disabled={busy}
                    onClick={() =>
                      void changeStatus(
                        restaurant.id,
                        null,
                      )
                    }
                  >
                    {t("listsRemove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

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

      {/* Original catalog editor */}
      <div className="my-lists-editor">
        <select
          aria-label={t("listsSelect")}
          value={selectedId}
          onChange={(event) =>
            setSelectedId(event.target.value)
          }
        >
          <option value="">
            {t("listsSelect")}
          </option>

          {restaurants.map((restaurant) => (
            <option
              key={restaurant.id}
              value={restaurant.id}
            >
              {restaurant.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() =>
            void changeStatus(selectedId, "to_visit")
          }
        >
          {t("listsToVisit")}
        </button>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() =>
            void changeStatus(selectedId, "visited")
          }
        >
          {t("listsVisitedAction")}
        </button>

        <button
          type="button"
          disabled={!selectedId || busy}
          onClick={() =>
            void changeStatus(selectedId, null)
          }
        >
          {t("listsRemove")}
        </button>
      </div>

      {/* Loading and error messages */}
      {googleLoading && (
        <p>{t("listsGoogleLoading")}</p>
      )}

      {googleError && (
        <p role="alert">
          {t("listsGoogleError")}
        </p>
      )}

      {messageKey && (
        <p role="status">
          {t(messageKey)}
        </p>
      )}

      {/* Combined lists */}
      <div className="my-lists-grid">
        {renderSavedList("to_visit")}
        {renderSavedList("visited")}
      </div>

      {/* Existing sharing feature: demo restaurants only */}
      <div className="share-controls">
        <button
          type="button"
          disabled={savedItems.length === 0}
          onClick={() =>
            void handleShareLists()
          }
        >
          {t("listsShareDemo")}
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

        <p>{t("listsGoogleShareNotice")}</p>
      </div>
    </section>
  );
}
