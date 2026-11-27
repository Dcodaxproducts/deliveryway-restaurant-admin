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

const collectMessages = (value, prefix = "") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [[prefix, value]];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectMessages(child, nextPrefix);
  });
};

const enMessages = readJson(enPath);
const deMessages = readJson(dePath);
const enEntries = new Map(collectMessages(enMessages));
const deEntries = new Map(collectMessages(deMessages));
const enKeys = new Set(enEntries.keys());
const deKeys = new Set(deEntries.keys());


const extractArguments = (message) => {
  if (typeof message !== "string") return [];
  return [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?=\s*[,}])/g)].map((match) => match[1]).sort();
};

const interpolationMismatches = [...enKeys].filter((key) => {
  if (!deEntries.has(key)) return false;
  return JSON.stringify(extractArguments(enEntries.get(key))) !== JSON.stringify(extractArguments(deEntries.get(key)));
});

const asciiGermanMismatches = [...deEntries].filter(([, value]) =>
  typeof value === "string" && /\b(?:fuer|ueber|menue|guelt|waehl|muess|koenn|benoet|verfueg|zurueck|strasse|laeng)\w*/i.test(value),
);

const missingInGerman = [...enKeys].filter((key) => !deKeys.has(key)).sort();
const missingInEnglish = [...deKeys].filter((key) => !enKeys.has(key)).sort();

if (missingInGerman.length || missingInEnglish.length || interpolationMismatches.length || asciiGermanMismatches.length) {
  if (missingInGerman.length) {
    console.error("Missing keys in src/messages/de.json:");
    for (const key of missingInGerman) console.error(`- ${key}`);
  }

  if (missingInEnglish.length) {
    console.error("Missing keys in src/messages/en.json:");
    for (const key of missingInEnglish) console.error(`- ${key}`);
  }

  if (interpolationMismatches.length) {
    console.error("ICU interpolation arguments differ between English and German:");
    for (const key of interpolationMismatches) console.error(`- ${key}`);
  }

  if (asciiGermanMismatches.length) {
    console.error("German messages contain ASCII umlaut substitutions:");
    for (const [key, value] of asciiGermanMismatches) console.error(`- ${key}: ${value}`);
  }

  process.exit(1);
}

console.log(`Message keys match (${enKeys.size} keys).`);
