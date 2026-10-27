import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const write = (p, data) =>
  writeFileSync(join(root, p), `${JSON.stringify(data, null, 2)}\n`);

const part = process.argv[2] ?? "patch";
if (!["major", "minor", "patch"].includes(part)) {
  console.error("Usage: node scripts/bump-version.mjs [major|minor|patch]");
  process.exit(1);
}

const manifest = read("manifest.json");
const versions = read("versions.json");

const [major, minor, patch] = manifest.version.split(".").map(Number);
let next;
if (part === "major") next = [major + 1, 0, 0];
else if (part === "minor") next = [major, minor + 1, 0];
else next = [major, minor, patch + 1];
const version = next.join(".");

manifest.version = version;
write("manifest.json", manifest);

versions[version] = manifest.minAppVersion;
write("versions.json", versions);

const pkg = read("package.json");
pkg.version = version;
write("package.json", pkg);

console.log(`Bumped to ${version}`);
