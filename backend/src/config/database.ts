import { DatabaseSync } from "node:sqlite"; // importamos la clase DatabaseSync desde el módulo "node:sqlite" para interactuar con la base de datos SQLite de manera sincrónica.

Deno.mkdirSync("./data", { recursive: true }); // creamos un directorio llamado "data" de manera recursiva si no existe, para almacenar la base de datos SQLite.

export const database = new DatabaseSync("./data/restaurant.db"); // creamos una instancia de la clase DatabaseSync y la exportamos como "database". Esta instancia se conecta a un archivo de base de datos SQLite llamado "restaurant.db" ubicado en el directorio "data".

database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    nonce TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  image_url TEXT
);
`); // ejecutamos una serie de comandos SQL para configurar la base de datos. Esto incluye habilitar las claves foráneas y crear tres tablas: "users", "sessions" y "oauth_states", si no existen ya. Cada tabla tiene sus propias columnas y restricciones, como claves primarias y referencias a otras tablas.


database.prepare(`
  INSERT OR IGNORE INTO restaurants
  (id, name, description, category, address, latitude, longitude, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "restaurant-1",
  "Sushi Central",
  "Restaurante especializado en sushi y comida japonesa.",
  "Japonesa",
  "Viña del Mar",
  -33.0245,
  -71.5518,
  null,
);

database.prepare(`
  INSERT OR IGNORE INTO restaurants
  (id, name, description, category, address, latitude, longitude, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "restaurant-2",
  "Burger House",
  "Restaurante especializado en hamburguesas.",
  "Hamburguesas",
  "Valparaíso",
  -33.0472,
  -71.6127,
  null,
);

database.prepare(`
  INSERT OR IGNORE INTO restaurants
  (id, name, description, category, address, latitude, longitude, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "restaurant-3",
  "Pasta Bella",
  "Restaurante especializado en comida italiana.",
  "Italiana",
  "Viña del Mar",
  -33.0153,
  -71.5500,
  null,
);

const restaurantColumns = database
  .prepare("PRAGMA table_info(restaurants)")
  .all() as { name: string }[];

if (!restaurantColumns.some((column) => column.name === "average_price")) {
  database.exec(`
    ALTER TABLE restaurants
    ADD COLUMN average_price INTEGER NOT NULL DEFAULT 12000;
  `);

  database.exec(`
    UPDATE restaurants
    SET average_price = CASE id
      WHEN 'restaurant-1' THEN 15000
      WHEN 'restaurant-2' THEN 11000
      WHEN 'restaurant-3' THEN 13000
      ELSE average_price
    END;
  `);
}


database.exec(`
  CREATE TABLE IF NOT EXISTS ratings (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, restaurant_id)
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search TEXT NOT NULL,
    category TEXT NOT NULL,
    max_price INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_search_history_user
  ON search_history(user_id, created_at DESC);
`);


database.exec(`
  CREATE TABLE IF NOT EXISTS user_restaurant_lists (
    user_id TEXT NOT NULL
      REFERENCES users(id) ON DELETE CASCADE,

    restaurant_id TEXT NOT NULL
      REFERENCES restaurants(id) ON DELETE CASCADE,

    status TEXT NOT NULL
      CHECK (status IN ('visited', 'to_visit')),

    updated_at TEXT NOT NULL,

    PRIMARY KEY (user_id, restaurant_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_restaurant_lists
  ON user_restaurant_lists(user_id, status);
`);


/*
 * Store Google Place IDs associated with each user.
 * Google Places content is not stored permanently.
 */
database.exec(`
  CREATE TABLE IF NOT EXISTS google_restaurant_lists (
    user_id TEXT NOT NULL
      REFERENCES users(id) ON DELETE CASCADE,

    place_id TEXT NOT NULL,

    status TEXT NOT NULL
      CHECK (status IN ('visited', 'to_visit')),

    updated_at TEXT NOT NULL,

    PRIMARY KEY (user_id, place_id)
  );

  CREATE INDEX IF NOT EXISTS idx_google_restaurant_lists
  ON google_restaurant_lists(user_id, status);
`);


