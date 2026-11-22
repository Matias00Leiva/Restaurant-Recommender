
# FoodieFind — Recomendador personalizado de restaurantes

**Proyecto semestral | Diseño de Software | Universidad Adolfo Ibáñez | 2026-2**

FoodieFind es una aplicación web para descubrir restaurantes cercanos y recibir recomendaciones personalizadas a partir de las preferencias del usuario, su historial de búsquedas y sus calificaciones. Incorpora autenticación con Google, geolocalización, búsqueda de restaurantes reales mediante Google Places, listas personales y consulta de reseñas.

> **Estado del proyecto:** la implementación prevista está integrada y supera las verificaciones automatizadas disponibles. La validación funcional completa en el navegador y las consultas reales a Google Places dependen de la configuración y las cuotas del servicio. El entorno de demostración es **local**; no incluye despliegue público.

## 1. Objetivos

- Permitir descubrir restaurantes considerando la ubicación y el tipo de comida.
- Filtrar los resultados por nombre, categoría gastronómica, distancia y nivel de presupuesto disponible.
- Proponer restaurantes utilizando interacciones y preferencias personales.
- Guardar restaurantes en listas de **visitados** y **por visitar**.
- Consultar opiniones externas y registrar calificaciones propias.
- Compartir enlaces de restaurantes y listas.
- Ofrecer una interfaz adaptable y disponible en español e inglés.

## 2. Funcionalidades

| Módulo | Descripción |
| --- | --- |
| Autenticación SSO | Inicio de sesión con Google mediante OpenID Connect; gestión de sesiones en el backend. |
| Restaurantes reales | Consulta de restaurantes a través de Google Places API (New). |
| Geolocalización | Solicita permiso al navegador para calcular restaurantes próximos al usuario. |
| Búsqueda y filtros | Búsqueda por nombre, tipo de cocina, distancia y nivel de precio cuando Google lo informa. |
| Ordenamiento y paginación | Orden por distancia, valoración o cantidad de opiniones; visualización progresiva de seis resultados. |
| Recomendaciones | Algoritmo basado en reglas que utiliza búsquedas anteriores, preferencias por categoría y calificaciones personales. |
| Calificaciones personales | Registro de puntuaciones entre 1 y 5, asociadas al usuario en SQLite. |
| Listas | Guarda restaurantes como **por visitar** o **visitados**. |
| Compartir | Genera enlaces a fichas de Google Maps y enlaces que contienen una copia de los IDs de las listas. |
| Reseñas externas | Consulta bajo demanda de reseñas de un restaurante seleccionado, más resumen de puntuaciones y temas mencionados. |
| Multilenguaje | Español e inglés con un diccionario de traducciones propio, sin servicios externos de traducción. |
| Responsive | Interfaz CSS adaptada a distintas resoluciones; requiere comprobación visual final. |

### Alcance de los datos de Google

- Los restaurantes se identifican mediante **Google Place ID**.
- El presupuesto utiliza niveles cualitativos como económico, moderado o alto (`priceLevel`); **no representa precios exactos en pesos chilenos**.
- Google Places puede no entregar precio, calificación o reseñas para determinados establecimientos.
- El análisis de reseñas se construye solamente con los comentarios devueltos por Google (hasta cinco en una consulta de detalles). **No constituye una serie histórica representativa**.
- Las consultas de Nearby Search y Place Details dependen de las cuotas y la facturación de Google Cloud.

## 3. Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Deno, TypeScript, API HTTP basada en `Request` y `Response` |
| Base de datos | SQLite mediante `node:sqlite` |
| Identidad | Google OAuth 2.0 / OpenID Connect y biblioteca `jose` |
| Datos externos | Google Places API (New) y enlaces a Google Maps |
| Herramientas | Git, GitHub, VS Code, Deno |

El recomendador implementa un **sistema basado en reglas y puntuaciones**, no un modelo de aprendizaje automático entrenado.

## 4. Arquitectura

```text
Navegador
   |
   v
React + TypeScript + Vite (localhost:5173)
   |
   | HTTP /api + cookie de sesión
   v
Deno + TypeScript (localhost:8000)
   |
   +-- routes/        -> Endpoints y validaciones HTTP
   +-- controllers/   -> Lógica de controladores
   +-- middleware/    -> Protección de rutas y autenticación
   +-- services/      -> OAuth, Google Places, recomendaciones
   +-- repositories/  -> Acceso a datos
   +-- config/        -> Configuración y variables de entorno
   |
   +----> SQLite: usuarios, sesiones, búsquedas,
   |               calificaciones y listas
   |
   +----> Google OAuth / OpenID Connect
   |
   +----> Google Places API (New)
```

**Flujo principal:** el usuario inicia sesión con Google; el backend valida su identidad y crea una sesión. El frontend obtiene su perfil y permite buscar restaurantes reales. Las búsquedas se realizan desde el backend con la clave de Google Places. Las calificaciones y listas personales se almacenan en SQLite. El recomendador combina estos datos para ordenar restaurantes y mostrar el motivo de la sugerencia.

## 5. Estructura del proyecto

```text
Restaurant-Recommender/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── data/                    # Base SQLite local (no versionar)
│   ├── tests/
│   ├── deno.json
│   └── .env                     # Credenciales privadas (no versionar)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── i18n/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

La estructura muestra las carpetas principales. Pueden existir componentes y rutas heredados del catálogo de demostración, conservados para no afectar pruebas o datos anteriores.

## 6. Instalación y ejecución local

### 6.1. Requisitos previos

- **Deno 2.x** instalado y disponible en la terminal.
- Navegador web compatible con geolocalización.
- Credenciales OAuth de Google Cloud de tipo **Aplicación web**.
- **Places API (New)** habilitada y una clave de API válida para el backend.
- Conexión a Internet para el inicio de sesión con Google y las consultas a Places.

### 6.2. Configurar el backend

Desde la raíz del proyecto:

```bash
cd backend
```

Crea el archivo `backend/.env` con tus credenciales reales:

```dotenv
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=TU_CLIENT_ID
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
GOOGLE_PLACES_API_KEY=TU_GOOGLE_PLACES_API_KEY
```

En la consola de Google Cloud, registra como **URI de redirección autorizada**:

```text
http://localhost:8000/api/auth/google/callback
```

Inicia el servidor:

```bash
deno task dev
```

Por defecto, el backend responde en `http://localhost:8000`. La base SQLite se crea/utiliza en `backend/data/restaurant.db`.

Comprueba el estado del servidor en otra terminal:

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

### 6.3. Configurar el frontend

Abre otra terminal y ubícate en la carpeta correspondiente:

```bash
cd frontend
```

Instala las dependencias si todavía no están instaladas:

```bash
deno install
```

Ejecuta el frontend:

```bash
deno task dev
```

Abre **http://localhost:5173**.

**Conexión frontend–backend:** la configuración local de Vite debe reenviar las solicitudes `/api` hacia `http://127.0.0.1:8000`. Se puede comprobar abriendo `http://localhost:5173/api/health` y verificando que responda el JSON anterior. Los archivos que utilizan `VITE_API_URL` deben apuntar a un origen compatible con la configuración local; no se debe exponer la clave privada de Places en el frontend.

### 6.4. Detener la aplicación

Presiona `Ctrl + C` en las dos terminales. No es necesario utilizar Cloudflare Tunnel ni una dirección pública.

## 7. Flujo de uso

1. Entrar a `http://localhost:5173` e iniciar sesión con Google.
2. Acceder al dashboard con la cuenta autenticada.
3. Autorizar la geolocalización y elegir el radio de búsqueda disponible.
4. Buscar restaurantes reales, ordenar los resultados y aplicar filtros.
5. Mostrar resultados adicionales con el botón **Ver más**, sin volver a consultar Google para paginar los resultados ya recibidos.
6. Calificar restaurantes de 1 a 5 y guardarlos como **por visitar** o **visitados**.
7. Solicitar recomendaciones personalizadas considerando las interacciones guardadas.
8. Seleccionar un restaurante, consultar sus reseñas y revisar el resumen de la muestra.
9. Abrir su ubicación en Google Maps, compartir enlaces y cambiar entre español e inglés.

## 8. Sistema de recomendaciones

La personalización se implementa mediante un algoritmo de puntuación. En términos generales:

- Utiliza las calificaciones positivas y negativas del usuario para inferir afinidad con categorías de comida.
- Considera el historial de búsqueda para identificar intereses.
- Puede valorar restaurantes guardados o sus características relacionadas.
- Excluye los restaurantes registrados como **visitados** de las nuevas sugerencias.
- Utiliza información como popularidad y cercanía para complementar el ordenamiento.
- Devuelve recomendaciones con una explicación de la razón predominante.

Las calificaciones **personales** guardadas por FoodieFind son distintas de las calificaciones **públicas** de Google Maps. No se publica ninguna calificación del usuario en Google.

## 9. Reseñas y tendencias

La aplicación consulta los detalles del restaurante seleccionado utilizando su Google Place ID. Cuando Google proporciona comentarios, FoodieFind puede mostrar:

- Calificación general del restaurante y número total de calificaciones de Google.
- Comentarios individuales disponibles.
- Distribución de estrellas **dentro de la muestra recibida**.
- Cantidad de opiniones positivas, neutrales y negativas de la muestra.
- Temas frecuentes detectados con reglas de texto (por ejemplo, comida, servicio o precio).
- Comparación orientativa entre comentarios anteriores y más recientes cuando hay suficientes fechas.

**Limitación:** el análisis no incluye todas las reseñas del restaurante. Los comentarios devueltos por Google son una selección reducida; no representan necesariamente la evolución real de su reputación. Si no se reciben comentarios, se muestra la información disponible y el acceso a Google Maps.

Para evitar consultas repetidas, el endpoint de reseñas aplica una espera de dos minutos entre solicitudes dentro del mismo proceso de servidor.

## 10. Principales endpoints

| Método | Ruta | Función |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del servidor. |
| `GET` | `/api/auth/google` | Inicio del flujo de autenticación. |
| `GET` | `/api/auth/google/callback` | Recepción de la autorización de Google. |
| `GET` | `/api/auth/me` | Información del usuario autenticado. |
| `POST` | `/api/auth/logout` | Cierre de sesión. |
| `GET` | `/api/nearby-restaurants?latitude=...&longitude=...&radiusKm=...` | Consulta de restaurantes cercanos. |
| `GET` | `/api/google-reviews?placeId=...` | Reseñas del restaurante elegido. |
| `GET / POST` | `/api/google-ratings` | Consulta y actualización de calificaciones personales. |
| `GET / POST` | `/api/google-my-lists` | Consulta y actualización de listas personales. |
| `GET` | `/api/google-my-lists/details` | Detalles disponibles de restaurantes guardados. |
| `GET / POST` | `/api/search-history` | Consulta y registro del historial. |
| `GET` | `/api/restaurants` | Catálogo histórico de demostración conservado en backend. |

Las rutas de datos personales y de Google Places requieren autenticación cuando corresponde. El cálculo de recomendaciones reales se efectúa a partir de los restaurantes recuperados y las preferencias del usuario.

## 11. Pruebas y validaciones

### Backend

En `backend/`:

```bash
deno task check
deno task test
```

**Resultado confirmado el 22 de noviembre de 2026:**

```text
ok | 20 passed | 0 failed
```

| Archivo de pruebas | Pruebas aprobadas |
| --- | ---: |
| `auth_test.ts` | 4 |
| `nearby_test.ts` | 4 |
| `places_features_test.ts` | 2 |
| `real_recommendation_test.ts` | 6 |
| `restaurant_test.ts` | 4 |
| **Total** | **20** |

También se ejecutó `deno task check` sin errores. La tarea `check` configurada comprueba `src/server.ts` y `tests/auth_test.ts`; la ejecución de `deno task test` comprobó además los otros archivos de prueba antes de ejecutarlos.

El error `RESOURCE_EXHAUSTED` que se muestra en una prueba es **simulado intencionalmente** para comprobar la gestión del límite diario, y esa prueba terminó correctamente.

### Frontend

En `frontend/`:

```bash
deno task build
```

**Resultado confirmado el 22 de noviembre de 2026:** TypeScript y Vite completaron la compilación sin errores; se transformaron **38 módulos**.

### Comprobaciones manuales pendientes

Las pruebas automatizadas y la compilación no reemplazan la verificación del flujo completo en el navegador. Antes de la demostración, comprobar:

- Inicio de sesión y acceso al dashboard.
- Búsqueda de restaurantes reales cuando exista cuota de Google disponible.
- Filtros de cocina, presupuesto y distancia.
- Guardado, eliminación y lectura de listas y calificaciones.
- Cambio del orden de recomendaciones después de registrar preferencias.
- Consulta de reseñas y apertura de enlaces de Google Maps.
- Interfaz en español/inglés y visualización en tamaño móvil.

## 12. Seguridad y manejo de datos

- Autenticación con Google OpenID Connect; las credenciales privadas permanecen en el backend.
- Cookies de sesión y comprobaciones de autenticación para proteger operaciones personales.
- Persistencia de usuarios, sesiones, búsquedas, calificaciones y listas en SQLite local.
- Consultas a Google Places desde el servidor para evitar colocar la clave privada en React.
- Validación de coordenadas y radios; manejo de errores de cuota y de servicios externos.
- Los enlaces de listas compartidas codifican IDs de restaurantes, no credenciales de los usuarios.

**Nunca subir a GitHub:** `backend/.env`, `frontend/.env.local`, claves API, secretos OAuth, archivos de base de datos, `node_modules/` ni `frontend/dist/`.

Antes de publicar el proyecto se necesitaría una revisión adicional de HTTPS, restricciones de credenciales, facturación, sesiones, privacidad y políticas de Google Maps Platform. El despliegue público **no forma parte del alcance actual**.

## 13. Limitaciones conocidas

1. La disponibilidad de restaurantes y reseñas depende de Google Places y de sus cuotas diarias.
2. El filtro de presupuesto usa categorías estimadas por Google, no valores monetarios exactos.
3. El resumen de reseñas utiliza una muestra limitada y no debe interpretarse como tendencia histórica completa.
4. Las recomendaciones son basadas en reglas; no emplean un modelo de ML entrenado.
5. Los enlaces de listas reflejan los restaurantes incluidos al momento de compartir y no se actualizan automáticamente.
6. En modo local, un enlace `localhost` no es accesible directamente desde otros dispositivos.
7. Se conservan archivos del catálogo de ejemplo para compatibilidad, pero la interfaz principal está orientada a restaurantes reales.
8. El comportamiento responsive y las integraciones externas requieren validación manual adicional.

## 14. Desarrollo iterativo y versionamiento

El trabajo se organizó de forma incremental: primero estructura del proyecto y autenticación; luego persistencia, frontend, catálogo y personalización; finalmente integración con Google Places, listas, reseñas, filtros y pruebas.

El curso solicita **al menos un commit por semana** desde el 5 de octubre de 2026. La evidencia del proceso se encuentra en el historial real de Git; este documento no sustituye los commits ni debe atribuir fechas que no estén registradas.

Comandos útiles antes de entregar:

```bash
git status
git log --oneline --date=short -10
git add README.md
git commit -m "docs: update FoodieFind README and final validation"
git push
```

Ejecuta `git commit` solo cuando los archivos correctos estén preparados y confirma primero que no incluyan información privada.

## 15. Documentación y referencias

- [Deno](https://docs.deno.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [SQLite](https://www.sqlite.org/)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/guide)
- [Biblioteca jose](https://github.com/panva/jose)

### Asistencia de inteligencia artificial

Se utilizó **ChatGPT** como herramienta de apoyo para planificar la arquitectura, desarrollar y revisar código, resolver errores, diseñar pruebas y redactar documentación. El proyecto fue integrado y verificado mediante las herramientas de desarrollo y los resultados de pruebas indicados anteriormente. La asistencia de IA no sustituye la comprensión del código ni la validación manual de sus funcionalidades.
