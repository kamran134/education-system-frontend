---
name: add-stats-column
description: Checklist for adding a new statistic/column (student/teacher/school/district) to the stats and dashboard features. Use when asked to add, expose, or make configurable a new field in the ratings/stats tables or their Excel export.
---

# Adding a stats column

A new statistic/column touches the same five places every time, in this order:

1. **Model** — `src/app/core/models/{entity}.model.ts`. Add the field to the entity interface (`Student`, `Teacher`, `School`, `District`, ...). Confirm the backend already returns it (see `stat.controller.ts` on the backend) — if not, this is a backend change first, not a frontend one.
2. **Column options** — `src/app/features/dashboard/components/stats-columns/stats-columns.component.ts`. Add `{ key, label }` to the matching `{entity}ColumnOptions` array (`studentColumnOptions`, `teacherColumnOptions`, `schoolColumnOptions`, `districtColumnOptions`, or the month/developing-student variants). The `key` is the persisted column identifier used everywhere (including `displayedColumns` matching) — it does **not** have to match the model field name (see step 3's `field`).
3. **Table presenter** — `src/app/features/stats/components/{entity}-year-tab/*-year-tab.component.ts`. Add a `TableColumn` entry to the component's `allColumns` array: `{ key: 'key', label: '...', sortable: true }`. The `get columns()` getter already filters `allColumns` by `displayedColumns.includes(c.key)` — no template changes needed. Use `field: 'model.path'` when the model property name differs from the persisted `key` (e.g. teachers' `key: 'fullName'` reads `field: 'fullname'`), or when reading a nested property (e.g. `field: 'district.name'`). Use `formatter: (value, row) => ...` for anything beyond a straight value read — em-dash fallback for unset places, `roundNumber`-style rounding, "not found" fallback text for a missing relation, etc. Check `stats-main/stats.component.ts` if the column also needs to be added to a default/initial `displayedColumns` set.
4. **Excel export** — `src/app/core/services/excel.service.ts`. Add the key to the matching `{entity}ColumnMap` with its Azerbaijani label and value accessor, so exports stay in sync with the on-screen table.
5. **Persisted settings (only if new category)** — `src/app/core/models/settings.model.ts` (`UserSettings`), if this is a new column *category* rather than a new key inside an existing array. Most single-column additions don't need this.

Don't skip step 2 or 4 even for a "just show it in the table" ask — a column that's on-screen but missing from `stats-columns` (user can't toggle it) or `excel.service.ts` (missing from export) is a half-finished change and will come back as a bug report.