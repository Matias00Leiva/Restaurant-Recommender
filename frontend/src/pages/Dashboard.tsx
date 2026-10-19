import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
}

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
  
};

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
}