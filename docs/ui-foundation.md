# Shared UI foundation

This document freezes the Partner UI pattern ownership established in Phase 1. The same public names and responsibilities will be implemented locally in Superadmin and Customer when their migration phases begin; the repositories remain independently releasable.

## Ownership

| Responsibility | Canonical owner |
|---|---|
| Authenticated shell | `src/components/layout/AppShell.tsx` |
| Page width, gutter, rhythm, sticky actions | `src/components/common/Container.tsx` (`PageLayout`) |
| Page title, context, tabs, actions | `src/components/common/PageHeader.tsx` |
| Section surface | `src/components/common/SectionCard.tsx` |
| Metrics | `src/components/common/stats-section.tsx` + `src/components/cards/stats-card.tsx` |
| Data table | `src/components/common/DataTable.tsx` |
| Desktop/mobile data presentation | `src/components/common/ResponsiveDataView.tsx` |
| Search/filter layout and mobile filter sheet | `src/components/common/FilterBar.tsx` |
| Pagination/meta behavior | `src/components/common/PaginationSection.tsx` (`PaginationBar`) |
| Semantic status | `src/components/common/status-badge.tsx` |
| Loading/empty/error/unavailable/permission state | `src/components/common/EmptyState.tsx` (`StatePanel`) |
| Label/help/error relationship | `src/components/common/FormField.tsx` |
| Form body, sections, and action regions | `src/components/common/FormLayout.tsx` (`FormLayout`, `FormSection`, `FormActions`) |
| Detail body, panels, and metadata | `src/components/common/DetailLayout.tsx` (`DetailLayout`, `DetailPanel`, `InfoList`) |
| Settings navigation, content, status, and actions | `src/components/common/SettingsLayout.tsx` |
| Desktop Dialog/mobile Sheet composition | `src/components/common/ResponsiveDialog.tsx` |
| Destructive confirmation | `src/components/common/dialogs/delete-dialog.tsx` (`ConfirmDialog`) |

`Container`, `StatsSection`, `EmptyState`, `PaginationSection`, `DeleteDialog`, and `ModalActions` remain compatibility export names for current consumers. They resolve to the canonical implementations; they are not parallel components.

## Phase 3 composition contracts

- `FormLayout` owns the responsive main/preview composition; `FormSection` owns field grids and optional disclosure; `FormActions` owns primary, secondary, destructive, sticky, and mobile action arrangement.
- `FormField` accepts either ordinary children or a render function that supplies the stable control ID, required state, invalid state, and description relationship.
- `DetailLayout` owns summary/main/sidebar composition; `DetailPanel` owns grouped detail surfaces; `InfoList` renders typed semantic label/value metadata.
- `SettingsLayout` owns optional section navigation, content, live save status, and sticky actions.
- `ResponsiveDialog` uses a desktop Dialog and mobile Sheet while sharing title, description, scrollable body, actions, size, busy state, and controlled-close behavior.
- `ConfirmDialog` retains destructive/default tones and now exposes busy labels and inline errors while preventing accidental dismissal during a pending action.

These components own presentation only. Feature hooks, mutations, validation schemas, permissions, query keys, payloads, pricing, and workflow state remain with their current domain owners.

## Reuse checklist

Before adding presentation code:

1. Search this ownership table and existing primitives by responsibility.
2. Extend a canonical component with a typed variant or composition slot when the responsibility matches.
3. Keep data fetching, mutations, permissions, pricing, navigation, and domain state outside shared UI.
4. Create a domain component only for genuinely domain-specific rendering or behavior.
5. Do not add another table shell, responsive data switch, pagination implementation, state panel, filter shell, status badge, form-field shell, or confirmation dialog.
6. Add no `any` to a shared contract.
7. Prove keyboard semantics, loading/empty/error states, mobile layout, typecheck, tests, lint, and build before migration.

The automated ownership check runs through `npm run check:ui`.
