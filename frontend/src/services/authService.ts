
// Use the configured API URL or the current website origin.
const API_URL =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

// Retrieve the currently authenticated user.
export async function getCurrentUser() {
  const response = await fetch(
    `${API_URL}/api/auth/me`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("No authenticated user");
  }

  return await response.json();
}

// End the user's active session.
export async function logout(): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/auth/logout`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}
