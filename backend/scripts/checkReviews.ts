
const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

if (!apiKey) {
  throw new Error("GOOGLE_PLACES_API_KEY is missing");
}

// Verified Google Place ID for La Flor de Chile.
const placeId = "ChIJraBBsefdiZYRrWAqkj4l9Q4";

interface GoogleReview {
  rating?: number;
  text?: {
    text?: string;
  };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
  };
}

interface PlaceDetails {
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GoogleReview[];
  error?: {
    message?: string;
  };
}

// Request restaurant details and Google reviews.
const response = await fetch(
  `https://places.googleapis.com/v1/places/${placeId}`,
  {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews",
    },
  },
);

const data = await response.json() as PlaceDetails;

if (!response.ok) {
  console.error(
    "Google Places error:",
    data.error?.message ?? response.status,
  );
  Deno.exit(1);
}

console.log("Restaurant:", data.displayName?.text);
console.log("Address:", data.formattedAddress);
console.log("Google rating:", data.rating ?? "Not available");
console.log("Total ratings:", data.userRatingCount ?? 0);
console.log("Reviews returned:", data.reviews?.length ?? 0);
console.log("Google Maps:", data.googleMapsUri ?? "Not available");

// Show the ratings and authors of the returned reviews.
for (const review of data.reviews ?? []) {
  console.log("--------------------------");
  console.log("Author:", review.authorAttribution?.displayName);
  console.log("Rating:", review.rating);
  console.log("Comment:", review.text?.text?.slice(0, 150) ?? "");
}
