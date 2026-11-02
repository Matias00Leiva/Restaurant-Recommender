export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(
    "http://localhost:8000/api/restaurants",
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener los restaurantes.");
  }

  const data = await response.json() as {
    restaurants: Restaurant[];
  };

  return data.restaurants;
}