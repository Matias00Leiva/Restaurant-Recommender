
import type { UserListItem } from "./userListService.ts";

// Create a link to a public restaurant page.
export function createRestaurantShareUrl(
  restaurantId: string,
): string {
  const url = new URL("/share", window.location.origin);

  url.searchParams.set("restaurant", restaurantId);

  return url.toString();
}

// Create a link containing a snapshot of the user's lists.
export function createListsShareUrl(
  items: UserListItem[],
): string {
  const url = new URL("/share", window.location.origin);

  const visited = items
    .filter((item) => item.status === "visited")
    .map((item) => item.restaurantId);

  const toVisit = items
    .filter((item) => item.status === "to_visit")
    .map((item) => item.restaurantId);

  url.searchParams.set("visited", visited.join(","));
  url.searchParams.set("toVisit", toVisit.join(","));

  return url.toString();
}
