
const API_URL = "http://localhost:8000";

export type ListStatus = "visited" | "to_visit";

export interface UserListItem {
  restaurantId: string;
  status: ListStatus;
}

// Get the restaurants saved by the current user.
export async function getUserList(): Promise<UserListItem[]> {
  const response = await fetch(`${API_URL}/api/my-lists`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load restaurant lists");
  }

  const data = await response.json() as {
    items: UserListItem[];
  };

  return data.items;
}

// Add, update, or remove a restaurant from a list.
export async function updateUserList(
  restaurantId: string,
  status: ListStatus | null,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/my-lists`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      restaurantId,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update restaurant list");
  }
}
