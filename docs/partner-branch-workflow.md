# Partner branch workflow

The Partner branch creator uses a three-stage flow without changing the sidebar layout:

1. Branch details, customer contact, optional branch administrator, location, and initial availability.
2. Review and create. The created branch is immediately refreshed into the existing branch list.
3. Explicit restaurant-menu assignment, including one default menu. The user may finish later, leaving the API's inherited/no-menu state unchanged.

## API contract assumptions

The Partner client expects these tenant-scoped endpoints:

- `GET /branches/:branchId/menus` → `{ data: { branchId, menuIds, defaultMenuId } }`. For transition tolerance, `data.menus: Array<{ id }>` is also accepted.
- `PUT /branches/:branchId/menus` with `{ menuIds: string[], defaultMenuId: string | null }` → the same response shape.
- `PATCH /branches/:branchId/suspend` is used immediately after creation when the requested initial status is inactive.

Restaurant menus remain restaurant-scoped. The UI does not invent branch fields, duplicate menus, or infer assignment from item overrides. If assignment endpoints are temporarily unavailable, the branch remains created, an accessible retry message is shown, and the user can finish later.

## Shell branding

The sidebar renders the selected RestaurantPicker/auth restaurant's resolved branding profile. If branding is unavailable or the logo fails, a neutral restaurant-workspace label and initials are shown; FeastFlow platform artwork is not used as a restaurant identity fallback.
