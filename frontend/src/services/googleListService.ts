
const API_URL =
  import.meta.env.VITE_API_URL ??
  window.location.origin;

export const GOOGLE_LIST_EVENT =
  "foodiefind-google-list-changed";

export type GoogleListStatus =
  | "visited"
  | "to_visit";

export interface GoogleListItem {
  placeId: string;
  status: GoogleListStatus;
}

export interface SavedGoogleRestaurant
  extends GoogleListItem {
  name: string | null;
  address: string | null;
  mapsUrl: string;
}

export interface GoogleListChangeDetail {
  placeId: string;
  status: GoogleListStatus | null;
}

// Retrieve saved Google Place IDs from SQLite.
export async function getGoogleList(): Promise<
  GoogleListItem[]
> {
  const response = await fetch(
    `${API_URL}/api/google-my-lists`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Google restaurant list",
    );
  }

  const data = await response.json() as {
    items: GoogleListItem[];
  };

  return data.items;
}

// Save or remove a restaurant from the user's list.
export async function updateGoogleList(
  placeId: string,
  status: GoogleListStatus | null,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/google-my-lists`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        placeId,
        status,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to update Google restaurant list",
    );
  }

  // Synchronize list changes across FoodieFind.
  window.dispatchEvent(
    new CustomEvent<GoogleListChangeDetail>(
      GOOGLE_LIST_EVENT,
      {
        detail: {
          placeId,
          status,
        },
      },
    ),
  );
}

// Retrieve live Google restaurant details when available.
export async function getSavedGoogleRestaurants(
  placeId?: string,
): Promise<SavedGoogleRestaurant[]> {
  const url = new URL(
    "/api/google-my-lists/details",
    API_URL,
  );

  if (placeId) {
    url.searchParams.set("placeId", placeId);
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Failed to load Google restaurant details",
    );
  }

  const data = await response.json() as {
    items: SavedGoogleRestaurant[];
  };

  return data.items;
}
