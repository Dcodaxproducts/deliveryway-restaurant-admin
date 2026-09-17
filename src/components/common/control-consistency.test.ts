import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = new URL("../../", import.meta.url).pathname;

const collectFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });

const tsxFiles = collectFiles(sourceRoot).filter(
  (path) => extname(path) === ".tsx" && !path.endsWith(".test.tsx"),
);

describe("partner control consistency", () => {
  it("uses input-driven search without page-level Search buttons", () => {
    const offenders = tsxFiles.filter((path) => {
      const source = readFileSync(path, "utf8");
      return (
        /<Button[\s\S]{0,500}(?:commonT|common|t)\("search"\)/.test(source) ||
        /<Button[\s\S]{0,300}>\s*Search\s*<\/Button>/.test(source)
      );
    });

    expect(offenders).toEqual([]);
  });

  it("routes date and time selection through shared shadcn controls", () => {
    const nativeDateTimeOffenders = tsxFiles.filter((path) =>
      /type="(?:date|time|datetime-local)"/.test(readFileSync(path, "utf8")),
    );
    const directCalendarOffenders = tsxFiles.filter((path) => {
      if (path.endsWith("/ui/calendar.tsx")) return false;
      return /\bDayPicker\b/.test(readFileSync(path, "utf8"));
    });

    expect(nativeDateTimeOffenders).toEqual([]);
    expect(directCalendarOffenders).toEqual([]);
  });

  it("keeps calendar navigation clickable and primary hover behavior canonical", () => {
    const calendarSource = readFileSync(
      new URL("../ui/calendar.tsx", import.meta.url),
      "utf8",
    );
    const inconsistentPrimaryButtons = tsxFiles.filter((path) => {
      const source = readFileSync(path, "utf8");
      return (
        /bg-primary[^"\n]*hover:bg-(?:red-(?:600|700|800)|\[#e14f20\])/.test(
          source,
        ) || /bg-red-500[^"\n]*hover:bg-red-600/.test(source)
      );
    });

    expect(calendarSource).toContain('className={cn("relative p-3"');
    expect(calendarSource).toContain("pointer-events-auto size-8");
    expect(inconsistentPrimaryButtons).toEqual([]);
  });

  it("keeps scrollbars thin and removes browser arrow controls", () => {
    const styles = readFileSync(
      new URL("../../app/globals.css", import.meta.url),
      "utf8",
    );

    expect(styles).toContain("scrollbar-width: thin");
    expect(styles).toContain("*::-webkit-scrollbar-button");
    expect(styles).toContain("display: none");
  });
});
