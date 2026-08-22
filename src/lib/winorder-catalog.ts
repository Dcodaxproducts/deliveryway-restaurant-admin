export type WinOrderMasterArticle = {
  name: string;
  articleNo: string | null;
};

export type WinOrderCatalogComparison = {
  matchedNames: string[];
  missingNames: string[];
  duplicateNames: string[];
};

const normalizeName = (value: string) => value.trim().toLocaleLowerCase("de-DE");

const parseCsvRows = (content: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += character;
  }

  if (quoted) throw new Error("Invalid quoted CSV field");
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
};

const parseCsv = (content: string): WinOrderMasterArticle[] => {
  for (const delimiter of [";", ",", "\t"]) {
    const rows = parseCsvRows(content, delimiter);
    const headers = (rows[0] ?? []).map((value) =>
      value.replace(/^\uFEFF/, "").trim().toUpperCase(),
    );
    const nameIndex = headers.indexOf("CAPTION");
    if (nameIndex < 0) continue;
    const articleNoIndex = headers.indexOf("ARTICLENO");
    return rows.slice(1).flatMap((row) => {
      const name = row[nameIndex]?.trim();
      if (!name) return [];
      return [
        {
          name,
          articleNo: row[articleNoIndex]?.trim() || null,
        },
      ];
    });
  }
  throw new Error("WinOrder CSV must contain a CAPTION column");
};

const decodeXmlText = (value: string): string =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#([0-9]+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .trim();

const readXmlField = (block: string, field: string): string | null => {
  const match = block.match(
    new RegExp(`<${field}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${field}>`, "i"),
  );
  return match ? decodeXmlText(match[1]) : null;
};

const parseXml = (content: string): WinOrderMasterArticle[] => {
  const articles: WinOrderMasterArticle[] = [];
  const articlePattern =
    /<(?:T)?ArticleData(?:\s[^>]*)?>([\s\S]*?)<\/(?:T)?ArticleData>/gi;
  for (const match of content.matchAll(articlePattern)) {
    const name = readXmlField(match[1], "Caption");
    if (!name) continue;
    const articleNo = readXmlField(match[1], "ArticleNo");
    articles.push({
      name,
      articleNo: articleNo || null,
    });
  }
  if (articles.length === 0) {
    throw new Error("WinOrder XML must contain ArticleData entries");
  }
  return articles;
};

export const parseWinOrderCatalog = (
  content: string,
  fileName: string,
): WinOrderMasterArticle[] => {
  const normalizedFileName = fileName.trim().toLowerCase();
  if (normalizedFileName.endsWith(".xml") || content.trimStart().startsWith("<")) {
    return parseXml(content);
  }
  if (normalizedFileName.endsWith(".csv")) return parseCsv(content);
  throw new Error("Select a WinOrder CSV or XML article export");
};

export const compareWinOrderCatalog = (
  localNames: string[],
  winOrderArticles: WinOrderMasterArticle[],
): WinOrderCatalogComparison => {
  const localByNormalizedName = new Map<string, string>();
  for (const name of localNames) {
    const normalized = normalizeName(name);
    if (normalized && !localByNormalizedName.has(normalized)) {
      localByNormalizedName.set(normalized, name.trim());
    }
  }

  const winOrderCounts = new Map<string, number>();
  for (const article of winOrderArticles) {
    const normalized = normalizeName(article.name);
    if (!normalized) continue;
    winOrderCounts.set(normalized, (winOrderCounts.get(normalized) ?? 0) + 1);
  }

  const matchedNames: string[] = [];
  const missingNames: string[] = [];
  for (const [normalized, name] of localByNormalizedName) {
    if (winOrderCounts.has(normalized)) matchedNames.push(name);
    else missingNames.push(name);
  }
  const duplicateNames = [...winOrderCounts.entries()]
    .filter(
      ([normalized, count]) =>
        count > 1 && localByNormalizedName.has(normalized),
    )
    .flatMap(([normalized]) => {
      const name = localByNormalizedName.get(normalized);
      return name ? [name] : [];
    });

  return {
    matchedNames: matchedNames.sort((left, right) => left.localeCompare(right)),
    missingNames: missingNames.sort((left, right) => left.localeCompare(right)),
    duplicateNames: duplicateNames.sort((left, right) => left.localeCompare(right)),
  };
};
