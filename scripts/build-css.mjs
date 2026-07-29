// Emit the library's compiled stylesheet: components.css with its
// tokens.css import inlined, so dist/styles.css is self-contained.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src", "components");
const tokens = readFileSync(join(srcDir, "tokens.css"), "utf8");
const components = readFileSync(join(srcDir, "components.css"), "utf8");

const out = components.replace(/@import\s+"\.\/tokens\.css";/, tokens.trimEnd());
if (out === components) {
  throw new Error("components.css no longer imports ./tokens.css — update scripts/build-css.mjs");
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "styles.css"), out);
console.log("dist/styles.css written");
