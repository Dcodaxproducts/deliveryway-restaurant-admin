// Run with node scripts/review-fixes.browser.mjs. Supply PLAYWRIGHT_MODULE and
// CHROMIUM_EXECUTABLE_PATH if Playwright/Chromium are installed outside this repo.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { PaginationBar } from '@/components/common/PaginationSection';
import { TableReservationsTable } from '@/components/pages/TableReservations/components/TableReservationsTable';
import en from '@/messages/en.json';
import '@/app/globals.css';
function Fixture() {
  const [page, setPage] = useState(1);
  const params = new URLSearchParams(location.search);
  const totalPages = Number(params.get('pages') || 3);
  return <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
    <form onSubmit={event => { event.preventDefault(); window.submissions++; }}>
      <button type="button" id="before">Before pagination</button>
      <PaginationBar {...(params.has('meta') ? { meta: { page, totalPages, total: totalPages * 10, limit: 10 } } :
        { page, totalPages, total: totalPages * 10, limit: 10, ...(params.has('disabled') ? { hasPrevious: false, hasNext: false } : {}) })}
        onPageChange={next => { window.calls.push(next); setPage(next); }} />
      <button type="button" id="after">After pagination</button>
    </form>
    <TableReservationsTable loading={false} restaurantId="restaurant-scope" branchId="fallback-scope" reservations={[
      { id: 'cancelled-1', branchId: 'branch-1', branch: { name: 'Central', address: '42 Main Street' },
        createdAt: '2026-09-01T10:00:00Z', cancelledAt: '2026-09-02T11:30:00Z', reservationDate: '2026-09-03T18:00:00Z',
        guestCount: 4, note: 'Window seat', status: 'CANCELLED', customer: null },
      { id: 'active-2', branchId: 'branch-2', branch: null,
        createdAt: '2026-09-01T10:00:00Z', cancelledAt: null, reservationDate: '2026-09-03T18:00:00Z',
        guestCount: 2, note: null, status: 'CONFIRMED', customer: null },
      { id: 'active-3', branchId: null, branch: null,
        createdAt: '2026-09-01T10:00:00Z', cancelledAt: null, reservationDate: '2026-09-03T18:00:00Z',
        guestCount: 1, note: null, status: 'REQUESTED', customer: null }
    ]} />
  </NextIntlClientProvider>;
}
window.calls = []; window.submissions = 0; window.mutations = [];
createRoot(document.getElementById('root')).render(<Fixture />);
`;

// Bundle the real components/CSS with only font loading and the API hook replaced.
// Nothing is written to the app build, and no Next/auth/API runtime is started.
const bundle = await build({
  root, configFile: false, envFile: false, publicDir: false, logLevel: "error",
  resolve: { alias: { "@": `${root}src` } },
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "isolated-review-fixture", enforce: "pre",
    resolveId(id) {
      if (id === "review-fixture") return "\0review-fixture.tsx";
      if (id.endsWith("/lib/fonts")) return "\0fonts";
      if (id.endsWith("/hooks/useTableReservations")) return "\0reservation-hook";
    },
    load(id) {
      if (id === "\0review-fixture.tsx") return fixture;
      if (id === "\0fonts") return 'export const poppins = { className: "" };';
      if (id === "\0reservation-hook") return 'export const useUpdateTableReservationStatus = () => ({ isPending: false, mutateAsync: async payload => { window.mutations.push(payload); } });';
    },
  }],
  build: { write: false, minify: false, lib: { entry: "review-fixture", formats: ["iife"], name: "ReviewFixture" }, rolldownOptions: { input: "review-fixture" } },
});
const output = (Array.isArray(bundle) ? bundle[0] : bundle).output;
const js = output.find(item => item.type === "chunk").code;
const css = output.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.source).join("\n");
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript" : req.url === "/fixture.css" ? "text/css" : "text/html");
  res.end(req.url === "/fixture.js" ? js : req.url === "/fixture.css" ? css : '<!doctype html><html><head><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const context = await browser.newContext({ timezoneId: "UTC", serviceWorkers: "block" });
  const unexpected = [];
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === origin && route.request().method() === "GET") return route.continue();
    unexpected.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const button = name => page.getByRole("button", { name, exact: true });
  const focused = async name => assert.equal(await button(name).evaluate(el => el === document.activeElement), true, `${name} receives keyboard focus`);
  const current = async number => {
    await page.waitForFunction(n => document.querySelector('[aria-current="page"]')?.getAttribute("aria-label") === `Page ${n}`, number);
  };
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["", "?meta=1"]) {
      await page.goto(origin + mode);
      await button("Page 1").waitFor();
      assert.equal(await button("Go to previous page").isDisabled(), true);
      await button("Before pagination").focus();
      await page.keyboard.press("Tab"); await focused("Page 1");
      assert.equal(await button("Page 1").evaluate(el => el.matches(":focus-visible")), true);
      assert.notEqual(await button("Page 1").evaluate(el => getComputedStyle(el).boxShadow), "none");
      await page.keyboard.press("Tab"); await focused("Page 2");
      await page.keyboard.press("Enter"); await current(2); await focused("Page 2");
      await page.keyboard.press("Tab"); await focused("Page 3");
      await page.keyboard.press("Space"); await current(3); await focused("Page 3");
      assert.equal(await button("Go to next page").isDisabled(), true);
      await page.keyboard.press("Tab"); await focused("After pagination");
      await page.keyboard.press("Shift+Tab"); await focused("Page 3");
      await button("Before pagination").focus();
      await page.keyboard.press("Tab"); await focused("Go to previous page");
      await page.keyboard.press("Enter"); await current(2); await focused("Go to previous page");
      await page.keyboard.press("Space"); await current(1);
      await button("After pagination").focus();
      await page.keyboard.press("Shift+Tab"); await focused("Go to next page");
      await page.keyboard.press("Enter"); await current(2); await focused("Go to next page");
      await page.keyboard.press("Space"); await current(3);
      assert.deepEqual(await page.evaluate(() => window.calls), [2, 3, 2, 1, 2, 3]);
      assert.equal(await page.evaluate(() => window.submissions), 0, "pagination must not submit its enclosing form");
      console.log(`PASS ${width}px ${mode ? "meta" : "flat"}: Tab/Shift+Tab, visible focus, Enter/Space numbers and Previous/Next, bounds, callbacks, no form submit`);
    }

    const rows = width === 1440 ? page.locator("tbody tr") : page.locator("article");
    const cancelled = rows.nth(0);
    assert.match(await cancelled.innerText(), /Cancelled[\s\S]*Sep 02, 2026, 11:30/);
    assert.match(await cancelled.innerText(), /42 Main Street/);
    assert.match(await cancelled.innerText(), /Window seat/);
    assert.match(await rows.nth(1).innerText(), /Branch ID: branch-2/);
    assert.match(await rows.nth(2).innerText(), /No branch/);
    for (const [index, reservationId, branchId] of [[0, "cancelled-1", "branch-1"], [2, "active-3", "fallback-scope"]]) {
      await rows.nth(index).getByRole("button", { name: "Open actions" }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("menuitem", { name: "Update Status" }).press("Enter");
      await page.getByRole("dialog").waitFor();
      await page.getByRole("dialog").getByRole("button", { name: "Update Status", exact: true }).press("Enter");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.deepEqual(await page.evaluate(() => window.mutations.at(-1)), {
        reservationId, payload: { status: index === 0 ? "CANCELLED" : "REQUESTED", restaurantId: "restaurant-scope", branchId },
      });
    }
    console.log(`PASS ${width}px: cancellation/address/ID/no-branch parity; real row menu/dialog handlers retain reservation and tenant scope (mutation mocked)`);
  }

  for (const query of ["?pages=1", "?disabled=1"]) {
    await page.goto(origin + query);
    await button("Page 1").waitFor();
    assert.equal(await button("Go to previous page").isDisabled(), true);
    assert.equal(await button("Go to next page").isDisabled(), true);
    await button("Before pagination").focus();
    await page.keyboard.press("Tab"); await focused("Page 1");
    await button("After pagination").focus();
    await page.keyboard.press("Shift+Tab"); await focused(query === "?pages=1" ? "Page 1" : "Page 3");
    assert.deepEqual(await page.evaluate(() => window.calls), []);
  }
  await page.goto(origin + "?pages=100");
  await button("Page 100").waitFor();
  assert.equal(await page.locator('[data-slot="pagination-bar"] button').count(), 5);
  await button("Page 100").press("Enter"); await current(100);
  assert.deepEqual(await page.evaluate(() => window.calls), [100]);
  await page.goto(origin + "?pages=0");
  await button("Before pagination").waitFor();
  assert.equal(await page.locator('[data-slot="pagination-bar"]').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, [], "no external traffic or API writes");
  console.log("PASS single/zero/large page sets and explicit disabled overrides; zero browser errors; zero external requests/API writes");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
