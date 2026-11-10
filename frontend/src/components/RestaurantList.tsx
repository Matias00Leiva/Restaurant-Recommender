
import { useEffect, useState } from "react";
import {
  getRestaurants,
  type Restaurant,
  type RestaurantFilters,
} from "../services/restaurantService.ts";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [filters, setFilters] = useState<RestaurantFilters>({});

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

  return (
    <section className="restaurant-list">
      <h2>Restaurantes</h2>

      <form
        className="restaurant-filters"
        onSubmit={(event) => {
          event.preventDefault();

          setFilters({
            search,
            category,
            maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
          });
        }}
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

      {loading ? (
        <p>Cargando restaurantes...</p>
      ) : error ? (
        <p>No se pudieron cargar los restaurantes.</p>
      ) : restaurants.length === 0 ? (
        <p>No se encontraron restaurantes.</p>
      ) : (
        restaurants.map((restaurant) => (
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
          </article>
        ))
      )}
    </section>
  );
}
