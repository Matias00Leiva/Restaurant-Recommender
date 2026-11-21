
const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

if (!apiKey) {
  throw new Error("GOOGLE_PLACES_API_KEY is missing");
}

// Search for a real restaurant using Google Places.
const response = await fetch(
  "https://places.googleapis.com/v1/places:searchText",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery:
        "La Flor de Chile, 8 Norte 601, Viña del Mar, Chile",
      pageSize: 1,
      languageCode: "es",
    }),
  },
);

interface Place {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
}

const data = await response.json() as {
  places?: Place[];
  error?: { message?: string };
};

if (!response.ok) {
  console.error(
    "Google Places error:",
    data.error?.message ?? response.status,
  );
  Deno.exit(1);
}

const place = data.places?.[0];

if (!place) {
  console.log("Restaurant not found.");
  Deno.exit(0);
}

console.log("Restaurant:", place.displayName?.text);
console.log("Address:", place.formattedAddress);
console.log("Place ID:", place.id);
