import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "src");
const sourceExtensions = new Set([".ts", ".tsx"]);
const resolveExtensions = [".ts", ".tsx", ".js", ".jsx"];
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["'](@\/[^"']+)["']|import\(\s*["'](@\/[^"']+)["']\s*\)/g;

const walk = (directory, files = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

const exactPathExists = (candidatePath) => {
  if (!existsSync(candidatePath)) {
    return false;
  }

  const parentDirectory = path.dirname(candidatePath);
  const basename = path.basename(candidatePath);

  if (!existsSync(parentDirectory)) {
    return false;
  }

  return readdirSync(parentDirectory).includes(basename);
};

const exactFileExists = (candidatePath) => {
  return exactPathExists(candidatePath) && statSync(candidatePath).isFile();
};

const resolveAliasImport = (importPath) => {
  const relativePath = importPath.slice(2);
  const absolutePath = path.join(srcDir, relativePath);

  if (exactFileExists(absolutePath)) {
    return absolutePath;
  }

  for (const extension of resolveExtensions) {
    const withExtension = `${absolutePath}${extension}`;

    if (exactFileExists(withExtension)) {
      return withExtension;
    }
  }

  for (const extension of [".ts", ".tsx"]) {
    const indexPath = path.join(absolutePath, `index${extension}`);

    if (exactFileExists(indexPath)) {
      return indexPath;
    }
  }

  return null;
};

const missingImports = [];

for (const filePath of walk(srcDir)) {
  const source = readFileSync(filePath, "utf8");
  let match;

  while ((match = importPattern.exec(source)) !== null) {
    const importPath = match[1] ?? match[2];

    if (!importPath.startsWith("@/")) {
      continue;
    }

    if (!resolveAliasImport(importPath)) {
      missingImports.push({
        file: path.relative(rootDir, filePath),
        importPath,
      });
    }
  }
}

if (missingImports.length > 0) {
  console.error("Missing local alias imports:");

  for (const missingImport of missingImports) {
    console.error(`- ${missingImport.file}: ${missingImport.importPath}`);
  }

  process.exit(1);
}

console.log("All local alias imports resolve with exact casing.");
