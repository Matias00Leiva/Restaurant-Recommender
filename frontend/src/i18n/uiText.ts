// Centralized FoodieFind UI translations.
import { useLanguage } from "./LanguageContext.tsx";

const messages = {
  es: {
  "ui_all_budgets_edaa7af": "Todos los presupuestos",
  "ui_analyze_reviews_a2612ff": "Analizar reseñas",
  "ui_budget_1c6225e": "Presupuesto",
  "ui_cafe_0d5f2e7": "Cafetería",
  "ui_choose_a_search_radius_to_discover__0a71e49": "Selecciona un radio de búsqueda para descubrir restaurantes.",
  "ui_could_not_copy_the_link_you_can_ope_39d31f8": "No se pudo copiar el enlace. Puedes abrirlo en Google Maps.",
  "ui_could_not_load_your_lists_78c5ec1": "No se pudieron cargar tus listas.",
  "ui_expensive_7c6d115": "Alto",
  "ui_explore_new_flavors_9ac91f0": "Explora nuevos sabores",
  "ui_find_restaurants_6b9bea9": "Buscar restaurantes",
  "ui_find_restaurants_near_you_discover__9eac3a9": "Encuentra restaurantes cerca de ti, descubre diferentes tipos de comida y guarda tus lugares favoritos para tu próxima salida.",
  "ui_google_reviews_were_analyzed_245137a": "Se analizaron {v0} reseñas mostradas por Google.",
  "ui_indicative_trend_ca1486f": "Tendencia orientativa",
  "ui_inexpensive_7c17332": "Económico",
  "ui_links_open_the_real_restaurant_list_24fb5a1": "Los enlaces abren las fichas reales de los restaurantes en Google Maps.",
  "ui_mentioned_topics_f189929": "Temas mencionados",
  "ui_moderate_5c42afc": "Moderado",
  "ui_newer_reviews_in_this_sample_have_a_a1ecd2c": "Las reseñas más recientes de la muestra tienen un promedio superior al de las anteriores.",
  "ui_newer_reviews_in_this_sample_have_a_e2157bb": "Las reseñas más recientes de la muestra tienen un promedio inferior al de las anteriores.",
  "ui_not_enough_topics_were_identified_i_a2a2acf": "No se identificaron temas suficientes en los comentarios disponibles.",
  "ui_organize_your_favorite_restaurants__a4421a5": "Organiza tus restaurantes favoritos, registra tus calificaciones y comparte los lugares que quieras visitar.",
  "ui_original_reviews_2460ac9": "Comentarios originales",
  "ui_other_f97e9da": "Otros",
  "ui_positive_neutral_negative_f19af79": "Positivas: {v0} · Neutrales: {v1} · Negativas: {v2}",
  "ui_price_level_5a7c378": "Nivel de precio",
  "ui_price_unavailable_6a9e657": "Precio no disponible",
  "ui_rating_distribution_20ee965": "Distribución de calificaciones",
  "ui_restaurant_1212ea9": "Restaurante",
  "ui_restaurant_list_shared_from_foodief_9b54067": "Lista de restaurantes compartidos desde FoodieFind.",
  "ui_review_summary_d796c3f": "Resumen de opiniones",
  "ui_sample_average_6332117": "Promedio de esta muestra",
  "ui_saved_restaurant_db7bcc6": "Restaurante guardado",
  "ui_select_a_real_restaurant_to_view_it_b375a5b": "Selecciona un restaurante real y consulta sus reseñas, un resumen de las opiniones y las señales de calificación disponibles.",
  "ui_select_a_restaurant_95f92b9": "Selecciona un restaurante",
  "ui_selected_restaurant_e89a7e7": "Restaurante seleccionado",
  "ui_show_more_restaurants_60dd54f": "Ver más restaurantes",
  "ui_showing_of_restaurants_ae39abe": "Mostrando {v0} de {v1} restaurantes",
  "ui_there_are_not_enough_dated_reviews__6667364": "No hay suficientes reseñas fechadas para comparar periodos.",
  "ui_there_is_no_substantial_change_betw_1f22373": "No se observa un cambio importante entre las reseñas anteriores y recientes de la muestra.",
  "ui_this_analysis_uses_only_google_sele_bf2febe": "Este análisis utiliza solo las reseñas seleccionadas por Google. No constituye una tendencia histórica representativa ni un análisis de todas las opiniones.",
  "ui_you_can_also_select_analyze_reviews_e7e9658": "También puedes elegir «Analizar reseñas» desde cualquier restaurante del catálogo."
},
  en: {
  "ui_all_budgets_edaa7af": "All budgets",
  "ui_analyze_reviews_a2612ff": "Analyze reviews",
  "ui_budget_1c6225e": "Budget",
  "ui_cafe_0d5f2e7": "Cafe",
  "ui_choose_a_search_radius_to_discover__0a71e49": "Choose a search radius to discover restaurants.",
  "ui_could_not_copy_the_link_you_can_ope_39d31f8": "Could not copy the link. You can open it in Google Maps.",
  "ui_could_not_load_your_lists_78c5ec1": "Could not load your lists.",
  "ui_expensive_7c6d115": "Expensive",
  "ui_explore_new_flavors_9ac91f0": "Explore new flavors",
  "ui_find_restaurants_6b9bea9": "Find restaurants",
  "ui_find_restaurants_near_you_discover__9eac3a9": "Find restaurants near you, discover different cuisines, and save your favorite places for your next outing.",
  "ui_google_reviews_were_analyzed_245137a": "{v0} Google reviews were analyzed.",
  "ui_indicative_trend_ca1486f": "Indicative trend",
  "ui_inexpensive_7c17332": "Inexpensive",
  "ui_links_open_the_real_restaurant_list_24fb5a1": "Links open the real restaurant listings on Google Maps.",
  "ui_mentioned_topics_f189929": "Mentioned topics",
  "ui_moderate_5c42afc": "Moderate",
  "ui_newer_reviews_in_this_sample_have_a_a1ecd2c": "Newer reviews in this sample have a higher average than older ones.",
  "ui_newer_reviews_in_this_sample_have_a_e2157bb": "Newer reviews in this sample have a lower average than older ones.",
  "ui_not_enough_topics_were_identified_i_a2a2acf": "Not enough topics were identified in the available comments.",
  "ui_organize_your_favorite_restaurants__a4421a5": "Organize your favorite restaurants, save your ratings, and share places you want to visit.",
  "ui_original_reviews_2460ac9": "Original reviews",
  "ui_other_f97e9da": "Other",
  "ui_positive_neutral_negative_f19af79": "Positive: {v0} · Neutral: {v1} · Negative: {v2}",
  "ui_price_level_5a7c378": "Price level",
  "ui_price_unavailable_6a9e657": "Price unavailable",
  "ui_rating_distribution_20ee965": "Rating distribution",
  "ui_restaurant_1212ea9": "Restaurant",
  "ui_restaurant_list_shared_from_foodief_9b54067": "Restaurant list shared from FoodieFind.",
  "ui_review_summary_d796c3f": "Review summary",
  "ui_sample_average_6332117": "Sample average",
  "ui_saved_restaurant_db7bcc6": "Saved restaurant",
  "ui_select_a_real_restaurant_to_view_it_b375a5b": "Select a real restaurant to view its reviews, a summary, and the available rating patterns.",
  "ui_select_a_restaurant_95f92b9": "Select a restaurant",
  "ui_selected_restaurant_e89a7e7": "Selected restaurant",
  "ui_show_more_restaurants_60dd54f": "Show more restaurants",
  "ui_showing_of_restaurants_ae39abe": "Showing {v0} of {v1} restaurants",
  "ui_there_are_not_enough_dated_reviews__6667364": "There are not enough dated reviews to compare periods.",
  "ui_there_is_no_substantial_change_betw_1f22373": "There is no substantial change between older and newer reviews in the sample.",
  "ui_this_analysis_uses_only_google_sele_bf2febe": "This analysis uses only Google-selected reviews. It is not a representative historical trend or an analysis of every review.",
  "ui_you_can_also_select_analyze_reviews_e7e9658": "You can also select Analyze reviews from any restaurant in the catalog."
},
} as const;

type Key = keyof typeof messages.es;
type Parameters = Record<string, string | number>;

export function useUiText() {
  const { language } = useLanguage();
  return (key: Key, params: Parameters = {}): string => {
    const message: string = messages[language][key];
    return message.replace(/\{(v\d+)\}/g, (part, name: string) =>
      params[name] === undefined ? part : String(params[name]));
  };
}
