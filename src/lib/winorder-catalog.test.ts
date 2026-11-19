import { describe, expect, it } from "vitest";
import {
  compareWinOrderCatalog,
  getWinOrderLocalCatalogName,
  getUnlistedCatalogMappings,
  parseWinOrderCatalog,
} from "@/lib/winorder-catalog";

describe("getWinOrderLocalCatalogName", () => {
  it("uses resolved deal and package names with an id-safe legacy fallback", () => {
    expect(
      getWinOrderLocalCatalogName({
        key: "deal:family",
        dealName: "Family Feast",
        menuItemName: "Generic item",
      }),
    ).toBe("Family Feast");
    expect(
      getWinOrderLocalCatalogName({
        key: "package:lunch",
        packageName: "Lunch Package",
      }),
    ).toBe("Lunch Package");
    expect(getWinOrderLocalCatalogName({ key: "deal:legacy" })).toBe(
      "deal:legacy",
    );
  });
});

describe("parseWinOrderCatalog", () => {
  it("parses the documented WinOrder CSV columns", () => {
    const articles = parseWinOrderCatalog(
      '\uFEFFCAPTION;ARTICLENO;DEFAULTPRICE\r\n"Pizza, Spezial";P1;12.50\r\nOliven;E2;1.00',
      "articles.csv",
    );

    expect(articles).toEqual([
      { name: "Pizza, Spezial", articleNo: "P1" },
      { name: "Oliven", articleNo: "E2" },
    ]);
  });

  it("parses documented XML ArticleData entries", () => {
    const articles = parseWinOrderCatalog(
      `<?xml version="1.0"?>
      <Catalog>
        <TArticleData><ArticleNo>P1</ArticleNo><Caption>Pizza &amp; Pasta</Caption></TArticleData>
        <ArticleData><ArticleNo></ArticleNo><Caption><![CDATA[Extra Käse]]></Caption></ArticleData>
      </Catalog>`,
      "articles.xml",
    );

    expect(articles).toEqual([
      { name: "Pizza & Pasta", articleNo: "P1" },
      { name: "Extra Käse", articleNo: null },
    ]);
  });

  it("rejects files without documented article fields", () => {
    expect(() => parseWinOrderCatalog("name,number\nPizza,1", "items.csv"))
      .toThrow("CAPTION");
    expect(() => parseWinOrderCatalog("<Catalog />", "items.xml")).toThrow(
      "ArticleData",
    );
  });
});

describe("compareWinOrderCatalog", () => {
  it("reports case-insensitive matches, missing names, and duplicates", () => {
    const result = compareWinOrderCatalog(
      ["Pizza", "Extra Käse", "Oliven", "Pizza"],
      [
        { name: "pizza", articleNo: "P1" },
        { name: "Extra Käse", articleNo: "E1" },
        { name: "Extra Käse", articleNo: "E2" },
        { name: "Unrelated", articleNo: "U1" },
        { name: "Unrelated", articleNo: "U2" },
      ],
    );

    expect(result).toEqual({
      matchedNames: ["Extra Käse", "Pizza"],
      missingNames: ["Oliven"],
      duplicateNames: ["Extra Käse"],
    });
  });
});

describe("getUnlistedCatalogMappings", () => {
  it("retains configured package or deal mappings omitted by the live catalog", () => {
    expect(
      getUnlistedCatalogMappings(["item:pizza:base"], [
        {
          mappingType: "ITEM",
          localKey: "item:pizza:base",
          localName: "Pizza",
        },
        {
          mappingType: "ITEM",
          localKey: "deal:family-package",
          localName: "Family Package",
          externalArticleName: "Familienpaket",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        localKey: "deal:family-package",
        localName: "Family Package",
      }),
    ]);
  });
});
