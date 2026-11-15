
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getRestaurants,
  type Restaurant,
  type RestaurantFilters,
} from "../services/restaurantService.ts";

import {
  getSearchHistory,
  rateRestaurant,
  saveSearchHistory,
  type SearchHistoryItem,
} from "../services/activityService.ts"; 

interface Coordinates {
  latitude: number;
  longitude: number;
}

function calculateDistance(
  first: Coordinates,
  second: Coordinates,
): number {
  const toRadians = (value: number) => value * Math.PI / 180;

  const latDifference = toRadians(second.latitude - first.latitude);
  const lonDifference = toRadians(second.longitude - first.longitude);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(lonDifference / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [filters, setFilters] = useState<RestaurantFilters>({});

  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load restaurants whenever the filters change.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    getRestaurants(filters)
      .then((data) => {
        if (active) setRestaurants(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  // Load the user's search history.
  useEffect(() => {
    getSearchHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  // Apply filters and save the search.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const nextFilters: RestaurantFilters = {
      search: search.trim(),
      category,
      maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
    };

    setFilters(nextFilters);

    if (
      nextFilters.search ||
      nextFilters.category ||
      nextFilters.maxPrice !== undefined
    ) {
      try {
        await saveSearchHistory(nextFilters);
        setHistory(await getSearchHistory());
      } catch {
        setMessage("Los filtros se aplicaron, pero no se guardó el historial.");
      }
    }
  }

  // Request permission to obtain the user's location.
  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage("Tu navegador no admite geolocalización.");
      return;
    }

    setMessage("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setNearbyOnly(true);
        setMessage("Ubicación obtenida correctamente.");
      },
      () => {
        setMessage("No se pudo obtener la ubicación. Revisa los permisos.");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  // Save a restaurant rating.
  async function handleRating(
    restaurantId: string,
    rating: number,
  ) {
    try {
      await rateRestaurant(restaurantId, rating);

      setRestaurants(await getRestaurants(filters));
      setMessage("Calificación guardada correctamente.");
    } catch {
      setMessage("No se pudo guardar la calificación.");
    }
  }

  const visibleRestaurants = restaurants
    .map((restaurant) => ({
      ...restaurant,
      distanceKm: location
        ? calculateDistance(location, restaurant)
        : null,
    }))
    .filter(
      (restaurant) =>
        !nearbyOnly ||
        (restaurant.distanceKm !== null && restaurant.distanceKm <= 20),
    )
    .sort((a, b) => {
      if (location) {
        return (a.distanceKm ?? Infinity) -
          (b.distanceKm ?? Infinity);
      }

      return a.name.localeCompare(b.name);
    });

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant.id === selectedMapId,
  );

  const mapQuery = selectedRestaurant
    ? `${selectedRestaurant.latitude},${selectedRestaurant.longitude}`
    : "";

  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <section className="restaurant-list">
      <h2>Restaurantes</h2>

      {/* Search and filters */}
      <form
        className="restaurant-filters"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Buscar restaurante..."
          aria-label="Buscar restaurante"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Categoría"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="Japonesa">Japonesa</option>
          <option value="Hamburguesas">Hamburguesas</option>
          <option value="Italiana">Italiana</option>
        </select>

        <input
          type="number"
          min="0"
          step="1"
          placeholder="Presupuesto máximo ($)"
          aria-label="Presupuesto máximo"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />

        <button type="submit">
          Aplicar filtros
        </button>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategory("");
            setMaxPrice("");
            setFilters({});
          }}
        >
          Limpiar filtros
        </button>
      </form>

      {/* Geolocation */}
      <div className="location-controls">
        <button type="button" onClick={useMyLocation}>
          Buscar restaurantes cercanos
        </button>

        {location && (
          <button
            type="button"
            onClick={() => setNearbyOnly(!nearbyOnly)}
          >
            {nearbyOnly ? "Mostrar todos" : "Mostrar a 20 km"}
          </button>
        )}
      </div>

      {message && <p role="status">{message}</p>}

      {/* Restaurant cards */}
      {loading ? (
        <p>Cargando restaurantes...</p>
      ) : error ? (
        <p>No se pudieron cargar los restaurantes.</p>
      ) : visibleRestaurants.length === 0 ? (
        <p>No se encontraron restaurantes.</p>
      ) : (
        visibleRestaurants.map((restaurant) => (
          <article
            className="restaurant-card"
            key={restaurant.id}
          >
            <h3>{restaurant.name}</h3>

            <p>{restaurant.category}</p>
            <p>{restaurant.description}</p>
            <p>{restaurant.address}</p>

            <p>
              Precio estimado:{" "}
              {restaurant.averagePrice.toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0,
              })}
            </p>

            {restaurant.distanceKm !== null && (
              <p>
                Distancia aproximada:{" "}
                {restaurant.distanceKm.toFixed(1)} km
              </p>
            )}

            {/* Ratings */}
            <p>
              {restaurant.averageRating === null
                ? "Sin calificaciones"
                : `Calificación: ${restaurant.averageRating}/5 (${restaurant.ratingCount} usuarios)`}
            </p>

            <label>
              Tu calificación:{" "}
              <select
                defaultValue=""
                aria-label={`Calificar ${restaurant.name}`}
                onChange={(event) => {
                  void handleRating(
                    restaurant.id,
                    Number(event.target.value),
                  );
                }}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                <option value="1">1 estrella</option>
                <option value="2">2 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="5">5 estrellas</option>
              </select>
            </label>

            {/* Google Maps button */}
            <button
              type="button"
              onClick={() => setSelectedMapId(restaurant.id)}
            >
              Ver ubicación en Google Maps
            </button>
          </article>
        ))
      )}

      {/* Google Maps */}
      {selectedRestaurant && (
        <section className="restaurant-map">
          <h3>Mapa de {selectedRestaurant.name}</h3>

          {mapsKey ? (
            <iframe
              title={`Mapa de ${selectedRestaurant.name}`}
              src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsKey)}&q=${encodeURIComponent(mapQuery)}`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <p>
              Falta configurar la clave de Google Maps.
            </p>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Maps
          </a>
        </section>
      )}

      {/* Search history */}
      <section className="search-history">
        <h3>Últimas búsquedas</h3>

        {history.length === 0 ? (
          <p>Aún no tienes búsquedas registradas.</p>
        ) : (
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                {[
                  item.search && `Nombre: ${item.search}`,
                  item.category && `Categoría: ${item.category}`,
                  item.maxPrice !== null &&
                    `Hasta $${item.maxPrice.toLocaleString("es-CL")}`,
                ].filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
