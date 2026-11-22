
import { app } from "./app.ts";
import { env } from "./config/env.ts";

// Use localhost during development.
// Hosting platforms can expose the server through HOST=0.0.0.0.
const hostname = Deno.env.get("HOST") ?? "127.0.0.1";

Deno.serve(
  {
    hostname,
    port: env.port,
  },
  app,
);
