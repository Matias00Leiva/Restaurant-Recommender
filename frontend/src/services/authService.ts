export async function getCurrentUser() {
  const response = await fetch("http://localhost:8000/api/auth/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No authenticated user");
  }

  return await response.json();
}

export async function logout() {
  const response = await fetch("http://localhost:8000/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}