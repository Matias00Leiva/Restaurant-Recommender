export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  averagePrice: number;
  averageRating: number | null;
  ratingCount: number;
}