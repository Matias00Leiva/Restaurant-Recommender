import { useEffect, useState } from "react";
import {
  getRestaurants,
  type Restaurant,
} from "../services/restaurantService.ts";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurants()
      .then((data) => {
        setRestaurants(data);
      })
      .catch(() => {
        setRestaurants([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Cargando restaurantes...</p>;
  }

  return (
    <section className="restaurant-list">
      <h2>Restaurantes</h2>

      {restaurants.map((restaurant) => (
        <article
          className="restaurant-card"
          key={restaurant.id}
        >
          <h3>{restaurant.name}</h3>
          <p>{restaurant.category}</p>
          <p>{restaurant.description}</p>
          <p>{restaurant.address}</p>
        </article>
      ))}
    </section>
  );
}