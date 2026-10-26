import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
} // se define la interfaz User que representa la estructura de un usuario en la aplicación.

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const handleLogout = async () => {
  try {
    await logout();
    window.location.href = "/";
  } catch {
    console.error("No se pudo cerrar la sesión.");
  }
  
}; // esportamos la función Dashboard que representa la página del panel de control del usuario. Se utiliza el hook useState para manejar el estado del usuario y el estado de carga, y el hook useEffect para obtener los datos del usuario actual al cargar la página. Si no hay un usuario autenticado, se muestra un mensaje indicando que no hay una sesión activa. Si hay un usuario autenticado, se muestra su información y un botón para cerrar sesión.

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!user) {
    return <p>No hay una sesión activa.</p>;
  }

  return (
    <main>
      <h1>FoodieFind</h1>

      <h2>Bienvenido, {user.name}</h2>

      {user.picture && (
        <img
          src={user.picture}
          alt="Foto de perfil"
          width="100"
        />
      )}

      <p>{user.email}</p>
      <button onClick={handleLogout}>
        Cerrar sesión
        </button>
      
    </main>
  );
} //tenemos diferentes condiciones las cuales son: si la página está cargando, se muestra un mensaje de "Cargando..."; si no hay un usuario autenticado, se muestra un mensaje indicando que no hay una sesión activa; y si hay un usuario autenticado, se muestra su información y un botón para cerrar sesión.