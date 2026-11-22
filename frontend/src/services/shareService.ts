
import type {
  UserListItem,
} from "./userListService.ts";

import type {
  GoogleListItem,
} from "./googleListService.ts";

// Create a public link for a demo restaurant.
export function createRestaurantShareUrl(
  restaurantId: string,
): string {
  const url = new URL(
    "/share",
    window.location.origin,
  );

  url.searchParams.set(
    "restaurant",
    restaurantId,
  );

  return url.toString();
}

// Share a snapshot of demo and real restaurant lists.
export function createListsShareUrl(
  items: UserListItem[],
  googleItems: GoogleListItem[] = [],
): string {
  const url = new URL(
    "/share",
    window.location.origin,
  );

  const collect = <
    T extends {
      status: "visited" | "to_visit";
    },
  >(
    records: T[],
    status: "visited" | "to_visit",
    getId: (item: T) => string,
  ): string => {
    return [
      ...new Set(
        records
          .filter((item) => item.status === status)
          .map(getId),
      ),
    ].slice(0, 30).join(",");
  };

  // Demo restaurants.
  url.searchParams.set(
    "visited",
    collect(
      items,
      "visited",
      (item) => item.restaurantId,
    ),
  );

  url.searchParams.set(
    "toVisit",
    collect(
      items,
      "to_visit",
      (item) => item.restaurantId,
    ),
  );

  // Real Google restaurants.
  url.searchParams.set(
    "gVisited",
    collect(
      googleItems,
      "visited",
      (item) => item.placeId,
    ),
  );

  url.searchParams.set(
    "gToVisit",
    collect(
      googleItems,
      "to_visit",
      (item) => item.placeId,
    ),
  );

  return url.toString();
}
