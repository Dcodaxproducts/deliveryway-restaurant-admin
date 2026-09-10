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
| Destructive confirmation | `src/components/common/dialogs/delete-dialog.tsx` (`ConfirmDialog`) |

`Container`, `StatsSection`, `EmptyState`, `PaginationSection`, and `DeleteDialog` remain compatibility export names for current consumers. They resolve to the canonical implementations; they are not parallel components.

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
