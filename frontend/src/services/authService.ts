export async function getCurrentUser() {
  const response = await fetch("http://localhost:8000/api/auth/me", {
    credentials: "include",
  }); // se realiza una solicitud GET a la ruta "/api/auth/me" del servidor para obtener los datos del usuario autenticado. Se incluyen las credenciales de la sesión en la solicitud.

  if (!response.ok) {
    throw new Error("No authenticated user");
  } // si la respuesta no es exitosa, se lanza un error indicando que no hay un usuario autenticado.

  return await response.json();
} //retornamos la respuesta de la solicitud en formato JSON, que contiene los datos del usuario autenticado. Esta función se puede utilizar en otras partes de la aplicación para obtener la información del usuario actual.

export async function logout() {
  const response = await fetch("http://localhost:8000/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
} // exportamos la función logout que realiza una solicitud POST a la ruta "/api/auth/logout" del servidor para cerrar la sesión del usuario autenticado. Se incluyen las credenciales de la sesión en la solicitud. Si la respuesta no es exitosa, se lanza un error indicando que el cierre de sesión falló.