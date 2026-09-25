# Partner branch workflow

The Partner branch creator uses a three-stage flow without changing the sidebar layout:

1. Branch details, customer contact, optional branch administrator, location, and initial availability.
2. Review and create. The created branch is immediately refreshed into the existing branch list.
3. Explicit restaurant-menu assignment, including one default menu. The user may finish later, leaving the API's inherited/no-menu state unchanged.

## API contract assumptions

The Partner client expects these tenant-scoped endpoints:

- `GET /branches/:branchId/menus` → `{ data: { branchId, defaultMenuId: string | null, assignments: Array<{ restaurantMenuId, isDefault, menu }> } }`. The normalizer also accepts canonical `menuIds` when supplied, preferring it over assignments.
- `PUT /branches/:branchId/menus` requires a non-empty `{ menuIds: string[], defaultMenuId: string }`; the default must be included in `menuIds`.
- `PATCH /branches/:branchId/suspend` is called only after menu assignment or an explicit skip when inactive status was requested. The newly created branch remains active while assignment is performed because PUT requires an active branch.

Restaurant menus remain restaurant-scoped. The UI does not invent branch fields, duplicate menus, or infer assignment from item overrides. Menu-list and current-assignment load failures expose accessible retry actions. If final suspension fails after assignment or skip, the branch remains active and the workflow stays open with an explicit retry action; an already-saved assignment is not repeated.

## Shell branding

The sidebar renders the selected RestaurantPicker/auth restaurant's resolved branding profile. If branding is unavailable or the logo fails, a neutral restaurant-workspace label and initials are shown; FeastFlow platform artwork is not used as a restaurant identity fallback.
