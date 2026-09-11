# Phase 2 Placeholder Contracts

## Status

Presentation safety only. These changes do not implement missing business functionality and do not establish readiness for the full Phase 2 release. Existing routes and page-title meanings remain unchanged. Canonical owners are defined in `docs/ui-foundation.md`; no shared components are changed.

## Trash Pages

| Route | Owned page under `src/components/pages/` | Only page action |
| --- | --- | --- |
| `/branches/trash` | `branches/pages/BranchTrashPage.tsx` | Back to `/branches` |
| `/customer-settings/trash` | `customers/pages/CustomerTrashPage.tsx` | Back to `/customer-settings` |
| `/deliveryman/trash` | `deliverymen/pages/DeliverymanTrashPage.tsx` | Back to `/deliveryman` |
| `/employees-settings/trash` | `employees/pages/EmployeesTrashPage.tsx` | Back to `/employees-settings` |
| `/menu/trash` | `Menu/pages/MenuTrashPage.tsx` | Back to `/menu` |

Each page uses PageLayout, PageHeader, SectionCard and `StatePanel state="unavailable"`. Ordinary list components are no longer mounted on trash routes, so active employees or other ordinary records cannot be misrepresented as deleted records. Copy promising deleted records or restoration is removed; unavailable is not presented as a successfully loaded empty trash list. Inert Cancel/Confirm controls are removed. Navigation is limited to the existing parent list routes, with no retry or management actions.

**Excluded:** no new trash management, fetching, selection, restore, permanent deletion, bulk operations, API contracts, permissions or tenant behavior. Those business capabilities remain absent from these views, not implemented by this work. Existing list components and their callers outside trash remain untouched.

## Restaurants

`/restaurants` retains the English title "Restaurants List" (German: "Restaurantliste") through `settings/restaurants/pages/RestaurantsPage.tsx`. Its owned `Settings/restaurants/components/restaurants/table.tsx` renders a canonical unavailable StatePanel instead of the synthetic hardcoded list. The page no longer mounts the legacy action header, filters or pagination, which implied a connected list. The legacy header and add-restaurant route are not modified.

**Excluded:** no fabricated restaurant records, no new data fetching, no create/edit/delete integration and no replacement management flow. Restaurant listing and management remain unavailable in this view. An unavailable data source is not a zero-record result.

## Invoicing

`/invoicing` retains the title "Invoicing", the existing handoff explanation and the exact destination `/orders?tab=today` in `reports/invoices/pages/InvoicingPage.tsx`. It uses the canonical PageHeader and SectionCard instead of mounting a branch-specific header with unrelated import/create controls.

**Excluded:** existing invoice handoff unchanged; no invoice API, generation, download, email, subscription or payout behavior is implemented or modified. This page remains navigation to the existing order workflow, not a new invoice-management screen.

## Verification Contract

Associated tests render the actual canonical components and route wrappers. They check preserved titles, unavailable status semantics, parent back destinations, absence of ordinary/sample records and inert/destructive controls, removal of restaurant list filters/pagination, and the exact invoice destination without branch actions. Focused tests, owned-file ESLint and TypeScript are the local gates; browser UAT and release approval are separate. No commits, pushes or deployments are part of this task.

Local verification on 2026-09-11:

- `npm test -- src/components/pages/branches/pages/phase2-placeholder-presentation.test.tsx`: 15 tests passed.
- ESLint on the eight owned implementation files and associated test: passed without warnings.
- `npm run typecheck -- --incremental false`, `npm run check:ui` and `git diff --check`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://api.staging.feastflow.co/api/v1 npm run build`: passed, including exact-case import validation. The URL was supplied only to the process; no environment files changed. Existing `ENVIRONMENT_FALLBACK` and stale `baseline-browser-mapping` diagnostics remain.
- Full test suite and authenticated desktop/mobile browser UAT were not run for the original placeholder-safety task.

Localization follow-up on 2026-09-11: unavailable descriptions and parent navigation now use reusable `common.feedback` messages in English and German, resolved with `useTranslations` at feature level. Existing trash title translations remain intact; the restaurant list title is now localized too. No shared UI hooks, query/business changes or invoice-handoff changes are included. Pre-existing English inventory controls and notification headers are outside this introduced-feedback scope.

- EN/DE placeholder tests: 28 passed; combined feedback, placeholder, employee and existing chart regression tests: 199 passed across 5 files.
- Full suite: 102 files / 989 tests passed, including 37 additional localization cases over the previous 952 tests.
- TypeScript, build (65 static pages), exact-case imports, shared UI ownership, and EN/DE parity (3,308 keys) passed. Full lint: 0 errors / 94 warnings in untouched files; all 20 touched TSX files pass ESLint with `--max-warnings 0`.
- The restaurant feature uses the existing client i18n provider; no server next-intl configuration was added. Shared error-title defaults are overridden with translated messages in the feature tables.
- Existing `ENVIRONMENT_FALLBACK` and stale `baseline-browser-mapping` build diagnostics remain. No browser UAT rerun, runtime changes, commits or deployment.
