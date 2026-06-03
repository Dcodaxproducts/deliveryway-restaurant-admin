import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(process.cwd(), "src", "messages");
const enPath = path.join(messagesDir, "en.json");
const dePath = path.join(messagesDir, "de.json");

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Unable to read ${filePath}`);
    throw error;
  }
};

const collectKeys = (value, prefix = "") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectKeys(child, nextPrefix);
  });
};

const enMessages = readJson(enPath);
const deMessages = readJson(dePath);
const enKeys = new Set(collectKeys(enMessages));
const deKeys = new Set(collectKeys(deMessages));

const missingInGerman = [...enKeys].filter((key) => !deKeys.has(key)).sort();
const missingInEnglish = [...deKeys].filter((key) => !enKeys.has(key)).sort();

if (missingInGerman.length || missingInEnglish.length) {
  if (missingInGerman.length) {
    console.error("Missing keys in src/messages/de.json:");
    for (const key of missingInGerman) console.error(`- ${key}`);
  }

  if (missingInEnglish.length) {
    console.error("Missing keys in src/messages/en.json:");
    for (const key of missingInEnglish) console.error(`- ${key}`);
  }

  process.exit(1);
}

console.log(`Message keys match (${enKeys.size} keys).`);
