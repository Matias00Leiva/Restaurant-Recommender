
/**
 * Replace local-only API references with same-origin URLs.
 */

import {
  readFile,
  writeFile,
  readdir,
} from "node:fs/promises";

import { cwd } from "node:process";
import { join } from "node:path";

const sourceDirectory = join(cwd(), "src");

let changedFiles = 0;

async function visit(directory) {
  const entries = await readdir(
    directory,
    { withFileTypes: true },
  );

  for (const item of entries) {
    const fullPath = join(
      directory,
      item.name,
    );

    if (item.isDirectory()) {
      await visit(fullPath);
      continue;
    }

    if (!/\.(ts|tsx)$/.test(item.name)) {
      continue;
    }

    const before = await readFile(
      fullPath,
      "utf8",
    );

    let after = before;

    // Use the frontend origin as the default API origin.
    after = after.replace(
      /(const\s+(?:API_URL|BASE_URL|API_BASE_URL)\s*=\s*(?:import\.meta\.env\.VITE_API_URL\s*(?:\|\||\?\?)\s*)?)['"]http:\/\/localhost:8000['"]/g,
      "$1window.location.origin",
    );

    // Replace direct local API references.
    after = after.replaceAll(
      "http://localhost:8000/api/",
      "/api/",
    );

    after = after.replaceAll(
      "http://127.0.0.1:8000/api/",
      "/api/",
    );

    if (after !== before) {
      await writeFile(
        fullPath,
        after,
      );

      changedFiles++;

      console.log(
        "Updated:",
        fullPath,
      );
    }
  }
}

await visit(sourceDirectory);

console.log(
  `Updated ${changedFiles} frontend files.`,
);
