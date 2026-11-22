
/**
 * Centralize bilingual UI text in translation resources.
 * Run once from the frontend directory.
 */

import ts from "npm:typescript@6.0.3";
import {
  readFile,
  writeFile,
  mkdir,
} from "node:fs/promises";

import {
  createHash,
} from "node:crypto";

import { cwd } from "node:process";

import {
  join,
  dirname,
  resolve,
} from "node:path";

const root = cwd();

const paths = [
  "src/components/RestaurantList.tsx",
  "src/components/MyListsSection.tsx",
  "src/components/GoogleReviewsSection.tsx",
  "src/pages/SharedPage.tsx",
  "src/pages/Dashboard.tsx",
];

const resourcesPath = join(
  root,
  "src/i18n/uiText.ts",
);

const spanish = {};
const english = {};
const warnings = [];

// Read string and template literal values.
function readText(node, sourceFile) {
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return {
      message: node.text,
      expressions: [],
    };
  }

  if (!ts.isTemplateExpression(node)) {
    return null;
  }

  const expressions = [];
  let message = node.head.text;

  for (
    const [index, span] of
    node.templateSpans.entries()
  ) {
    expressions.push(
      span.expression.getText(sourceFile),
    );

    message +=
      `{v${index}}` + span.literal.text;
  }

  return { message, expressions };
}

// Generate a stable translation key.
function keyFor(message) {
  const slug = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\{v\d+\}/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 35) || "message";

  const hash = createHash("sha256")
    .update(message)
    .digest("hex")
    .slice(0, 7);

  return `ui_${slug}_${hash}`;
}

// Apply source changes without changing their positions.
function replaceRanges(source, changes) {
  let output = source;

  const ordered = changes.sort(
    (a, b) => b.start - a.start,
  );

  for (const change of ordered) {
    output =
      output.slice(0, change.start) +
      change.value +
      output.slice(change.end);
  }

  return output;
}

// Remove the old local() helper when no longer needed.
function stripUnusedLocalHelper(source) {
  let result = source.replace(
    /\n\s*function local\(esText: string, enText: string\)\s*\{\s*return es \? esText : enText;\s*\}/g,
    "",
  );

  result = result.replace(
    /\n\s*const local = \(esText: string, enText: string\)\s*=>\s*es \? esText : enText;/g,
    "",
  );

  if (!/\blocal\s*\(/.test(result)) {
    const withoutEs = result.replace(
      /\n\s*const es = language === "es";/g,
      "",
    );

    if (!/\bes\b/.test(withoutEs)) {
      result = withoutEs;
    }

    const occurrences =
      (result.match(/\blanguage\b/g) ?? []).length;

    if (occurrences === 1) {
      result = result.replace(
        /\{\s*t\s*,\s*language\s*\}\s*=\s*useLanguage\(\)/,
        "{ t } = useLanguage()",
      );
    }
  }

  return result;
}

// Inspect every selected component.
for (const relativePath of paths) {
  const absolutePath = resolve(
    root,
    relativePath,
  );

  let source;

  try {
    source = await readFile(
      absolutePath,
      "utf8",
    );
  } catch {
    continue;
  }

  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const changes = [];

  let convertedCount = 0;
  let skippedCount = 0;

  function walk(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) ===
        "local" &&
      node.arguments.length === 2
    ) {
      const first = readText(
        node.arguments[0],
        sourceFile,
      );

      const second = readText(
        node.arguments[1],
        sourceFile,
      );

      if (
        !first ||
        !second ||
        first.expressions.length !==
          second.expressions.length ||
        first.expressions.some(
          (expression, index) =>
            expression !==
            second.expressions[index],
        )
      ) {
        skippedCount++;
        return;
      }

      const key = keyFor(second.message);

      if (
        spanish[key] &&
        spanish[key] !== first.message
      ) {
        throw new Error(
          `Conflicting translation: ${key}`,
        );
      }

      spanish[key] = first.message;
      english[key] = second.message;

      const args =
        first.expressions.length === 0
          ? ""
          : `, { ${
              first.expressions
                .map(
                  (expression, index) =>
                    `v${index}: ${expression}`,
                )
                .join(", ")
            } }`;

      changes.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        value:
          `ui(${JSON.stringify(key)}${args})`,
      });

      convertedCount++;
      return;
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  if (convertedCount === 0) {
    continue;
  }

  source = replaceRanges(
    source,
    changes,
  );

  if (skippedCount === 0) {
    source = stripUnusedLocalHelper(source);
  }

  if (
    !source.includes(
      'from "../i18n/uiText.ts"',
    )
  ) {
    source =
      'import { useUiText } from "../i18n/uiText.ts";\n' +
      source;
  }

  const component = source.match(
    /export default function \w+\([^)]*\)\s*\{/,
  );

  if (!component) {
    throw new Error(
      `React component not found: ${relativePath}`,
    );
  }

  const insertion =
    component.index + component[0].length;

  source =
    source.slice(0, insertion) +
    "\n  const ui = useUiText();" +
    source.slice(insertion);

  await writeFile(
    absolutePath,
    source,
  );

  if (skippedCount > 0) {
    warnings.push(
      `${relativePath}: ${skippedCount} expressions require manual review`,
    );
  }

  console.log(
    `${relativePath}: ${convertedCount} translations centralized`,
  );
}

// Write the centralized translation resource.
if (Object.keys(spanish).length === 0) {
  console.log(
    "No new bilingual expressions were found.",
  );
} else {
  await mkdir(
    dirname(resourcesPath),
    { recursive: true },
  );

  const sorted = (obj) =>
    Object.fromEntries(
      Object.entries(obj).sort(
        ([a], [b]) => a.localeCompare(b),
      ),
    );

  const generated =
    `// Centralized FoodieFind UI translations.\n` +
    `import { useLanguage } from "./LanguageContext.tsx";\n\n` +
    `const messages = {\n` +
    `  es: ${JSON.stringify(sorted(spanish), null, 2)},\n` +
    `  en: ${JSON.stringify(sorted(english), null, 2)},\n` +
    `} as const;\n\n` +
    `type Key = keyof typeof messages.es;\n` +
    `type Parameters = Record<string, string | number>;\n\n` +
    `export function useUiText() {\n` +
    `  const { language } = useLanguage();\n` +
    `  return (key: Key, params: Parameters = {}): string => {\n` +
    `    const message: string = messages[language][key];\n` +
    `    return message.replace(/\\{(v\\d+)\\}/g, (part, name: string) =>\n` +
    `      params[name] === undefined ? part : String(params[name]));\n` +
    `  };\n` +
    `}\n`;

  await writeFile(
    resourcesPath,
    generated,
  );

  console.log(
    `Generated src/i18n/uiText.ts with ${
      Object.keys(spanish).length
    } translation keys`,
  );
}

for (const warning of warnings) {
  console.warn("REVIEW:", warning);
}
