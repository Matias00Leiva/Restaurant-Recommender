
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

type Language = "es" | "en";

const translations = {
  es: {
    // Nearby real restaurants.
    nearbyEyebrow: "RESTAURANTES REALES",
    nearbyTitle: "Descubre qué hay cerca de ti",
    nearbyDescription:
      "Explora nuevas opciones gastronómicas, encuentra lugares que se adapten a tus gustos y descubre tu próxima experiencia culinaria.",
    nearbyButton: "Buscar restaurantes reales cerca de mí",
    nearbyLocating: "Obteniendo ubicación...",
    nearbyLoading: "Buscando restaurantes en Google...",
    nearbyUnsupported:
      "Tu navegador no admite geolocalización.",
    nearbyGeoError:
      "No se pudo obtener tu ubicación. Revisa los permisos.",
    nearbyFetchError:
      "No se pudieron consultar los restaurantes en Google Places.",
    nearbyNotConfigured:
      "Falta configurar GOOGLE_PLACES_API_KEY en el backend.",
    nearbyRateLimited:
      "Ya hay una búsqueda en curso. Inténtalo nuevamente.",
    nearbyEmpty:
      "Google Places no encontró restaurantes dentro del radio seleccionado.",
    nearbyResults: "Restaurantes encontrados",
    nearbyDistance:
      "Distancia aproximada en línea recta",
    nearbyOpenMaps: "Abrir en Google Maps",
    nearbyAttribution: "Resultados obtenidos de",
    nearbyLimitations:
      "Las puntuaciones de Google y tus calificaciones personales se mantienen separadas.",
    nearbyRadius: "Radio de búsqueda",
    nearbySortLabel: "Ordenar resultados",
    nearbySortDistance: "Menor distancia",
    nearbySortRating: "Mayor calificación",
    nearbySortReviews: "Mayor cantidad de reseñas",
    nearbyRatings: "calificaciones en Google",
    nearbyNoRatings: "Sin calificaciones públicas",
    nearbySaveError:
      "No se pudieron cargar o actualizar los restaurantes guardados.",
    placesDailyQuota:
      "Se alcanzó el límite diario de consultas a Google Maps. Podrás buscar cuando se renueve la cuota.",

    // Authentication.
    loginTitle:
      "Tu próxima experiencia gastronómica comienza aquí.",
    loginDescription:
      "Encuentra nuevos restaurantes, explora lugares cercanos y descubre opciones según tus preferencias.",
    welcome: "Bienvenido",
    loginMessage:
      "Inicia sesión con Google para comenzar a descubrir restaurantes.",
    loginError:
      "No se pudo iniciar sesión con Google. Inténtalo nuevamente.",
    loginNote:
      "Inicia sesión de forma segura con tu cuenta de Google.",
    googleButton: "Continuar con Google",
    discover: "DESCUBRE · EXPLORA · DISFRUTA",
    loading: "Cargando FoodieFind...",
    logout: "Cerrar sesión",
    logoutError: "No se pudo cerrar la sesión.",

    // Main dashboard.
    heroEyebrow: "DESCUBRE TU PRÓXIMO FAVORITO",
    heroTitle: "Encuentra tu próximo",
    heroHighlight: " lugar favorito.",
    heroDescription:
      "Descubre restaurantes según tus gustos, presupuesto y ubicación.",
    exploreButton: "Explorar restaurantes",
    exploreEyebrow: "EXPLORA Y DESCUBRE",
    exploreDescription:
      "Utiliza los filtros, consulta las ubicaciones y califica los restaurantes que te gusten.",
    footer: "Proyecto Diseño de Software",

    // Original recommendations.
    recommendationEyebrow: "SELECCIONADOS PARA TI",
    recommendationTitle: "Recomendados para ti",
    recommendationDescription:
      "Descubre restaurantes basados en tus búsquedas, calificaciones y preferencias.",
    recommendationLoading: "Cargando recomendaciones...",
    recommendationError:
      "No se pudieron cargar las recomendaciones.",
    recommendationEmpty:
      "No hay restaurantes disponibles.",
    recommendedLabel: "Recomendado",
    estimatedPrice: "Precio estimado",
    reasonRatings: "Coincide con tus calificaciones",
    reasonCategories:
      "Coincide con tus categorías favoritas",
    reasonSearches: "Relacionado con tus búsquedas",
    reasonBudget: "Se ajusta a tu presupuesto",
    reasonDiscover: "Una opción para descubrir",
    categoryJapanese: "Japonesa",
    categoryItalian: "Italiana",
    categoryBurgers: "Hamburguesas",

    // Personal lists.
    listsEyebrow: "ORGANIZA TUS RESTAURANTES",
    listsTitle: "Mis listas",
    listsDescription:
      "Guarda restaurantes que quieras conocer y lleva un registro de los que ya visitaste.",
    listsLoading: "Cargando tus listas...",
    listsError: "No se pudieron cargar las listas.",
    listsUpdated: "Lista actualizada correctamente.",
    listsRemoved:
      "Restaurante eliminado de la lista.",
    listsUpdateError:
      "No se pudo actualizar la lista.",
    listsSelect: "Selecciona un restaurante",
    listsToVisit: "Por visitar",
    listsVisited: "Visitados",
    listsVisitedAction: "Visitado",
    listsRemove: "Quitar",
    listsMarkVisited: "Marcar visitado",
    listsEmptyToVisit:
      "Aún no tienes restaurantes pendientes.",
    listsEmptyVisited:
      "Aún no tienes restaurantes visitados.",
    listsShare: "Compartir mis listas",
    listsLinkCopied:
      "Enlace de las listas copiado correctamente.",
    listsLinkManual:
      "Copia el enlace que aparece debajo.",
    listsShareUrl: "Enlace para compartir",
    listsOpenLink: "Ver enlace compartido",
    listsGoogleLoading:
      "Cargando restaurantes reales guardados...",
    listsGoogleError:
      "No se pudieron obtener todos los datos de Google. Los restaurantes guardados siguen disponibles por su identificador.",
    listsGoogleUnavailable:
      "Restaurante real guardado",
    listsGoogleSource: "Información de Google Maps",
    listsDemoSource: "Restaurante de demostración",
    listsShareDemo:
      "Compartir restaurantes de demostración",
    listsGoogleShareNotice:
      "Los enlaces pueden incluir restaurantes reales identificados por Google Place ID.",

    // Original demo restaurant catalog.
    restaurantsTitle: "Restaurantes de demostración",
    restaurantSearch: "Buscar restaurante...",
    restaurantAllCategories: "Todas las categorías",
    restaurantMaxPrice: "Presupuesto máximo ($)",
    restaurantApplyFilters: "Aplicar filtros",
    restaurantClearFilters: "Limpiar filtros",
    restaurantNearby:
      "Filtrar ejemplos por ubicación",
    restaurantShowAll: "Mostrar todos",
    restaurantShowNearby:
      "Mostrar ejemplos a 20 km",
    restaurantLoading: "Cargando restaurantes...",
    restaurantError:
      "No se pudieron cargar los restaurantes.",
    restaurantEmpty:
      "No se encontraron restaurantes.",
    restaurantDistance: "Distancia aproximada",
    restaurantNoRatings: "Sin calificaciones",
    restaurantRating: "Calificación",
    restaurantRatingUser: "usuario",
    restaurantRatingUsers: "usuarios",
    restaurantYourRating: "Tu calificación",
    restaurantSelect: "Seleccionar",
    restaurantStar: "estrella",
    restaurantStars: "estrellas",
    restaurantMapButton:
      "Ver ubicación en Google Maps",
    restaurantMapTitle: "Mapa de",
    restaurantMapMissing:
      "Falta configurar la clave de Google Maps.",
    restaurantMapOpen: "Abrir en Google Maps",
    restaurantHistory: "Últimas búsquedas",
    restaurantHistoryEmpty:
      "Aún no tienes búsquedas registradas.",
    restaurantHistoryName: "Nombre",
    restaurantHistoryCategory: "Categoría",
    restaurantHistoryBudget: "Hasta",
    restaurantGeoLoading: "Obteniendo ubicación...",
    restaurantGeoSuccess:
      "Ubicación obtenida correctamente.",
    restaurantGeoError:
      "No se pudo obtener la ubicación. Revisa los permisos.",
    restaurantGeoUnsupported:
      "Tu navegador no admite geolocalización.",
    restaurantRatingSaved:
      "Calificación guardada correctamente.",
    restaurantRatingError:
      "No se pudo guardar la calificación.",
    restaurantHistoryError:
      "Los filtros se aplicaron, pero no se guardó el historial.",
    restaurantShareButton:
      "Copiar enlace del restaurante",
    restaurantShareCopied: "¡Enlace copiado!",
    restaurantShareCopiedHint:
      "Pégalo con Ctrl + V para compartir este restaurante.",
    restaurantShareReady:
      "Enlace listo para compartir",
    restaurantShareManual:
      "No se pudo copiar automáticamente. Selecciona y copia el enlace:",
    restaurantShareOpen: "Abrir página compartida",
    descriptionBurgers:
      "Restaurante especializado en hamburguesas.",
    descriptionItalian:
      "Restaurante especializado en comida italiana.",
    descriptionJapanese:
      "Restaurante especializado en sushi y comida japonesa.",

    // Shared restaurant pages.
    sharedHome: "Ir al inicio",
    sharedLoading: "Cargando contenido...",
    sharedError: "No se pudo cargar el catálogo.",
    sharedRestaurantEyebrow:
      "RESTAURANTE COMPARTIDO",
    sharedRestaurantTitle: "Descubre este restaurante",
    sharedRestaurantMissing:
      "El restaurante no fue encontrado.",
    sharedListsEyebrow: "LISTAS COMPARTIDAS",
    sharedListsTitle: "Restaurantes para descubrir",
    sharedListsDescription:
      "Estas listas representan los restaurantes guardados al momento de compartir el enlace.",
    sharedEmptyList:
      "No hay restaurantes en esta lista.",
    sharedInvalidLink:
      "El enlace compartido no es válido.",
    sharedDisclaimer:
      "Los restaurantes reales se identifican mediante Google Maps; los de demostración pertenecen al catálogo de FoodieFind.",
    sharedGooglePlace: "Restaurante real",
    sharedGoogleOpen:
      "Abrir restaurante en Google Maps",

    // Public Google reviews.
    googleReviewsEyebrow: "OPINIONES EXTERNAS",
    googleReviewsTitle: "Calificaciones de Google Maps",
    googleReviewsDescription:
      "Consulta la reputación de un restaurante real utilizando información de Google Maps.",
    googleReviewsButton:
      "Consultar reseñas de Google",
    googleReviewsLoading:
      "Consultando Google Maps...",
    googleReviewsError:
      "No se pudo obtener la información de Google Maps.",
    googleReviewsRateLimited:
      "Espera dos minutos antes de realizar otra consulta.",
    googleReviewsCount: "calificaciones en Google",
    googleReviewsNoComments:
      "Google no devolvió comentarios individuales en esta consulta. Puedes revisarlos directamente en Google Maps.",
    googleReviewsOpen:
      "Ver opiniones en Google Maps",
    googleReviewsSource: "Fuente:",
    googleReviewsOrder:
      "Google selecciona las reseñas por relevancia. Se muestran hasta cinco.",
    googleReviewsReviewSource:
      "Ver reseña original",
    googleReviewsPolicy:
      "Las opiniones corresponden a usuarios de Google Maps, no a FoodieFind.",

    // Personal FoodieFind ratings.
    personalRatingLabel:
      "Tu calificación en FoodieFind",
    personalRatingNone: "Sin calificación",
    personalRatingSaved:
      "Calificación personal actualizada.",
    personalRatingError:
      "No se pudo guardar tu calificación.",

    // Real personalized recommendations.
    realRecEyebrow: "PERSONALIZADO PARA TI",
    realRecTitle: "¿Dónde comer según tus gustos?",
    realRecDescription:
      "FoodieFind analiza tus calificaciones, listas y búsquedas anteriores para recomendarte hasta cinco restaurantes cercanos que podrían interesarte.",
    realRecRadius: "Radio de búsqueda",
    realRecButton: "Buscar recomendaciones",
    realRecLocating: "Obteniendo ubicación...",
    realRecLoading:
      "Buscando tus recomendaciones...",
    realRecUnsupported:
      "Tu navegador no admite geolocalización.",
    realRecGeoError:
      "No se pudo obtener tu ubicación. Revisa los permisos.",
    realRecFetchError:
      "No se pudieron obtener las recomendaciones.",
    realRecRateLimited:
      "Ya hay una búsqueda en curso. Inténtalo nuevamente.",
    realRecNotConfigured:
      "Google Places no está configurado.",
    realRecEmpty:
      "No se encontraron recomendaciones disponibles en esta búsqueda.",
    realRecResults: "Restaurantes recomendados",
    realRecReasonPersonal:
      "Coincide con una calificación personal positiva.",
    realRecReasonCuisine:
      "Coincide con tipos de comida que has calificado positivamente.",
    realRecReasonSaved:
      "Está en tu lista de restaurantes por visitar.",
    realRecReasonSearch:
      "Relacionado con tus búsquedas anteriores.",
    realRecReasonPopular:
      "Destaca por sus calificaciones en Google.",
    realRecReasonNearby:
      "Una opción cercana para descubrir.",
    realRecSource:
      "Información proporcionada por",
  },

  en: {
    // Nearby real restaurants.
    nearbyEyebrow: "REAL RESTAURANTS",
    nearbyTitle: "Discover what's near you",
    nearbyDescription:
      "Explore new dining options, find places that match your tastes, and discover your next culinary experience.",
    nearbyButton:
      "Find real restaurants near me",
    nearbyLocating: "Getting location...",
    nearbyLoading:
      "Searching Google for restaurants...",
    nearbyUnsupported:
      "Your browser does not support geolocation.",
    nearbyGeoError:
      "Could not get your location. Check your browser permissions.",
    nearbyFetchError:
      "Could not retrieve restaurants from Google Places.",
    nearbyNotConfigured:
      "GOOGLE_PLACES_API_KEY is not configured on the backend.",
    nearbyRateLimited:
      "A search is already in progress. Please retry.",
    nearbyEmpty:
      "Google Places found no restaurants within the search radius.",
    nearbyResults: "Restaurants found",
    nearbyDistance:
      "Approximate straight-line distance",
    nearbyOpenMaps: "Open in Google Maps",
    nearbyAttribution: "Results provided by",
    nearbyLimitations:
      "Google ratings and your personal ratings are kept separate.",
    nearbyRadius: "Search radius",
    nearbySortLabel: "Sort results",
    nearbySortDistance: "Nearest first",
    nearbySortRating: "Highest rating",
    nearbySortReviews: "Most reviews",
    nearbyRatings: "Google ratings",
    nearbyNoRatings: "No public ratings",
    nearbySaveError:
      "Could not load or update saved restaurants.",
    placesDailyQuota:
      "The daily Google Maps request limit has been reached. Search will return when the quota resets.",

    // Authentication.
    loginTitle:
      "Your next dining experience starts here.",
    loginDescription:
      "Find new restaurants, explore nearby places, and discover options based on your preferences.",
    welcome: "Welcome",
    loginMessage:
      "Sign in with Google to start discovering restaurants.",
    loginError:
      "Google sign-in failed. Please try again.",
    loginNote:
      "Sign in securely with your Google account.",
    googleButton: "Continue with Google",
    discover: "DISCOVER · EXPLORE · ENJOY",
    loading: "Loading FoodieFind...",
    logout: "Log out",
    logoutError: "Could not log out.",

    // Main dashboard.
    heroEyebrow: "DISCOVER YOUR NEXT FAVORITE",
    heroTitle: "Find your next",
    heroHighlight: " favorite place.",
    heroDescription:
      "Discover restaurants based on your tastes, budget, and location.",
    exploreButton: "Explore restaurants",
    exploreEyebrow: "EXPLORE AND DISCOVER",
    exploreDescription:
      "Use the filters, check locations, and rate the restaurants you like.",
    footer: "Software Design Project",

    // Original recommendations.
    recommendationEyebrow: "SELECTED FOR YOU",
    recommendationTitle: "Recommended for you",
    recommendationDescription:
      "Discover restaurants based on your searches, ratings, and preferences.",
    recommendationLoading:
      "Loading recommendations...",
    recommendationError:
      "Could not load recommendations.",
    recommendationEmpty:
      "No restaurants available.",
    recommendedLabel: "Recommended",
    estimatedPrice: "Estimated price",
    reasonRatings: "Matches your ratings",
    reasonCategories:
      "Matches your favorite cuisines",
    reasonSearches: "Related to your searches",
    reasonBudget: "Fits your budget",
    reasonDiscover: "A place to discover",
    categoryJapanese: "Japanese",
    categoryItalian: "Italian",
    categoryBurgers: "Burgers",

    // Personal lists.
    listsEyebrow: "ORGANIZE YOUR RESTAURANTS",
    listsTitle: "My lists",
    listsDescription:
      "Save restaurants you want to try and keep track of the places you have visited.",
    listsLoading: "Loading your lists...",
    listsError: "Could not load your lists.",
    listsUpdated: "List updated successfully.",
    listsRemoved:
      "Restaurant removed from the list.",
    listsUpdateError:
      "Could not update the list.",
    listsSelect: "Select a restaurant",
    listsToVisit: "Want to visit",
    listsVisited: "Visited",
    listsVisitedAction: "Visited",
    listsRemove: "Remove",
    listsMarkVisited: "Mark as visited",
    listsEmptyToVisit:
      "You have no restaurants to visit yet.",
    listsEmptyVisited:
      "You have no visited restaurants yet.",
    listsShare: "Share my lists",
    listsLinkCopied:
      "List link copied successfully.",
    listsLinkManual:
      "Copy the link shown below.",
    listsShareUrl: "Shareable link",
    listsOpenLink: "Open shared link",
    listsGoogleLoading:
      "Loading saved real restaurants...",
    listsGoogleError:
      "Some Google details are unavailable. Saved places remain accessible by their identifiers.",
    listsGoogleUnavailable:
      "Saved real restaurant",
    listsGoogleSource:
      "Information from Google Maps",
    listsDemoSource: "Demo restaurant",
    listsShareDemo: "Share demo restaurants",
    listsGoogleShareNotice:
      "Shared links may include real places identified by Google Place IDs.",

    // Original demo restaurant catalog.
    restaurantsTitle: "Demo restaurants",
    restaurantSearch: "Search restaurants...",
    restaurantAllCategories: "All cuisines",
    restaurantMaxPrice: "Maximum budget ($)",
    restaurantApplyFilters: "Apply filters",
    restaurantClearFilters: "Clear filters",
    restaurantNearby:
      "Filter demo places by location",
    restaurantShowAll: "Show all",
    restaurantShowNearby:
      "Show demo places within 20 km",
    restaurantLoading: "Loading restaurants...",
    restaurantError: "Could not load restaurants.",
    restaurantEmpty: "No restaurants found.",
    restaurantDistance: "Approximate distance",
    restaurantNoRatings: "No ratings yet",
    restaurantRating: "Rating",
    restaurantRatingUser: "user",
    restaurantRatingUsers: "users",
    restaurantYourRating: "Your rating",
    restaurantSelect: "Select",
    restaurantStar: "star",
    restaurantStars: "stars",
    restaurantMapButton:
      "View location on Google Maps",
    restaurantMapTitle: "Map of",
    restaurantMapMissing:
      "Google Maps API key is not configured.",
    restaurantMapOpen: "Open in Google Maps",
    restaurantHistory: "Recent searches",
    restaurantHistoryEmpty:
      "You have no saved searches yet.",
    restaurantHistoryName: "Name",
    restaurantHistoryCategory: "Cuisine",
    restaurantHistoryBudget: "Up to",
    restaurantGeoLoading:
      "Getting your location...",
    restaurantGeoSuccess:
      "Location obtained successfully.",
    restaurantGeoError:
      "Could not get your location. Check your permissions.",
    restaurantGeoUnsupported:
      "Your browser does not support geolocation.",
    restaurantRatingSaved:
      "Rating saved successfully.",
    restaurantRatingError:
      "Could not save your rating.",
    restaurantHistoryError:
      "Filters were applied, but the search history could not be saved.",
    restaurantShareButton:
      "Copy restaurant link",
    restaurantShareCopied: "Link copied!",
    restaurantShareCopiedHint:
      "Paste it with Ctrl + V to share this restaurant.",
    restaurantShareReady:
      "Link ready to share",
    restaurantShareManual:
      "Automatic copying failed. Select and copy this link:",
    restaurantShareOpen: "Open shared page",
    descriptionBurgers:
      "Restaurant specializing in burgers.",
    descriptionItalian:
      "Restaurant specializing in Italian cuisine.",
    descriptionJapanese:
      "Restaurant specializing in sushi and Japanese cuisine.",

    // Shared restaurant pages.
    sharedHome: "Back to home",
    sharedLoading: "Loading content...",
    sharedError:
      "Could not load the restaurant catalog.",
    sharedRestaurantEyebrow:
      "SHARED RESTAURANT",
    sharedRestaurantTitle:
      "Discover this restaurant",
    sharedRestaurantMissing:
      "Restaurant not found.",
    sharedListsEyebrow: "SHARED LISTS",
    sharedListsTitle:
      "Restaurants to discover",
    sharedListsDescription:
      "These lists show the restaurants saved when the link was shared.",
    sharedEmptyList:
      "No restaurants in this list.",
    sharedInvalidLink:
      "This shared link is invalid.",
    sharedDisclaimer:
      "Real restaurants are identified through Google Maps; demo restaurants belong to the FoodieFind catalog.",
    sharedGooglePlace: "Real restaurant",
    sharedGoogleOpen:
      "Open restaurant in Google Maps",

    // Public Google reviews.
    googleReviewsEyebrow: "EXTERNAL REVIEWS",
    googleReviewsTitle: "Google Maps ratings",
    googleReviewsDescription:
      "Check a real restaurant's reputation using information from Google Maps.",
    googleReviewsButton:
      "Load Google reviews",
    googleReviewsLoading:
      "Loading Google Maps data...",
    googleReviewsError:
      "Could not retrieve Google Maps information.",
    googleReviewsRateLimited:
      "Wait two minutes before making another request.",
    googleReviewsCount: "Google ratings",
    googleReviewsNoComments:
      "Google did not return individual reviews in this request. You can read them directly on Google Maps.",
    googleReviewsOpen:
      "View reviews on Google Maps",
    googleReviewsSource: "Source:",
    googleReviewsOrder:
      "Google selects reviews by relevance. Up to five are shown.",
    googleReviewsReviewSource:
      "View original review",
    googleReviewsPolicy:
      "Reviews come from Google Maps users, not FoodieFind.",

    // Personal FoodieFind ratings.
    personalRatingLabel: "Your FoodieFind rating",
    personalRatingNone: "Not rated",
    personalRatingSaved:
      "Personal rating updated.",
    personalRatingError:
      "Could not save your rating.",

    // Real personalized recommendations.
    realRecEyebrow: "PERSONALIZED FOR YOU",
    realRecTitle:
      "Where to eat based on your preferences?",
    realRecDescription:
      "FoodieFind uses your ratings, saved lists, and previous searches to recommend up to five nearby restaurants you might enjoy.",
    realRecRadius: "Search radius",
    realRecButton: "Find recommendations",
    realRecLocating:
      "Getting your location...",
    realRecLoading:
      "Finding your recommendations...",
    realRecUnsupported:
      "Your browser does not support geolocation.",
    realRecGeoError:
      "Could not get your location. Check your permissions.",
    realRecFetchError:
      "Could not retrieve recommendations.",
    realRecRateLimited:
      "A search is already in progress. Please retry.",
    realRecNotConfigured:
      "Google Places is not configured.",
    realRecEmpty:
      "No recommendations were found for this search.",
    realRecResults:
      "Recommended restaurants",
    realRecReasonPersonal:
      "Matches a positive personal rating.",
    realRecReasonCuisine:
      "Matches cuisines you have rated positively.",
    realRecReasonSaved:
      "This restaurant is on your to-visit list.",
    realRecReasonSearch:
      "Related to your previous searches.",
    realRecReasonPopular:
      "Stands out for its Google ratings.",
    realRecReasonNearby:
      "A nearby place to discover.",
    realRecSource:
      "Information provided by",
  },
};

type TranslationKey =
  keyof typeof translations.es;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

// Provide the selected language to the application.
export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguage] =
    useState<Language>(() =>
      localStorage.getItem("foodiefind-language") === "en"
        ? "en"
        : "es"
    );

  useEffect(() => {
    localStorage.setItem(
      "foodiefind-language",
      language,
    );

    document.documentElement.lang = language;
  }, [language]);

  function t(key: TranslationKey): string {
    return translations[language][key];
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Read the current language and translations.
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "LanguageProvider is missing",
    );
  }

  return context;
}

// Allow the user to switch between Spanish and English.
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label="Idioma / Language"
    >
      <button
        type="button"
        aria-pressed={language === "es"}
        onClick={() => setLanguage("es")}
      >
        ES
      </button>

      <button
        type="button"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
