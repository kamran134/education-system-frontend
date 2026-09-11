# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm start` / `ng serve` — dev server at http://localhost:4200
- `ng build` — production build, client-side only (no SSR/prerender — the Dockerfile serves the `browser/` output through nginx, `server.ts` was never used in prod and has been removed; prerendering pre-baked `/login` redirect stubs into every `authGuard`-protected route, since the guard runs without a browser at build time)
- `nginx.conf` — the container's nginx config (copied in by the Dockerfile). It does gzip and cache headers: hashed bundles (`-XXXXXXXX.js/css`) are `immutable, 1y`, `index.html` is `no-cache`, `assets/` is 7 days. Keep that split: `assets/` names don't change on update, so a long TTL there would pin stale images. TLS/HTTP2 live on the host's outer nginx, not here. Background: prod is in Frankfurt and the Baku→EU channel is ~200 KB/s per connection, so uncompressed weight is what made the landing "not open" for regional users (Sept 2026).
- `ng test` — Karma/Jasmine unit tests (see Testing note below before relying on these)
- `ng generate component|service|guard ...` — scaffolding; everything in this repo is standalone (no NgModules)

## Architecture

Standalone Angular 17 app, no NgModules, no NgRx/store. Single flat route table in `src/app/app.routes.ts` (eager by default; only `profile` and `admin` are lazy-loaded). Guards compose as `canActivate: [authGuard, roleGuard('canAccessX')]` — order matters, `authGuard` must run before `roleGuard`. Route keys map 1:1 to `RolePermissions['routes']` in `core/config/rbac.config.ts`.

- `core/services` — cross-cutting: `auth.service.ts` (BehaviorSubject-based session/role state), `permissions.service.ts` (RBAC checks), `excel.service.ts` (xlsx-js-style exports), `config.service.ts` (API base URL).
- `core/models` — one file per domain entity (district/school/student/teacher/exam/exam-type/...).
- `core/guards`, `core/directives/permissions.directive.ts` (`*hasPermission` / `*hasRole`).
- `features/*` — one directory per domain area (districts, regions, schools, teachers, students, exams, exam-types, certificates, metodika, stats, statistics, dashboard, ...), each with its own `services/*.service.ts` calling `HttpClient` directly via `ConfigService.getApiUrl()` and unwrapping through `ResponseHandlerUtil.extractData(...)`. There is no shared generic ApiService — this per-feature-service pattern is intentional, follow it rather than introducing a shared HTTP layer.
- `shared/components/ui/*` — a full custom kit (`data-table`, `button`, `card`, `dropdown`, `modal`, `tabs`, `toast`, `form-controls`, `fullscreen-panel`, `list-layout`, `confirm-dialog`). Use `ConfirmDialogService` (`shared/components/ui/confirm-dialog/confirm-dialog.service.ts`) for confirm-style dialogs, not `window.confirm` or a hand-rolled modal.
- Root routing has a public/authenticated split: `''` is `LandingComponent` (public marketing page, no guard), `/metodika` is also public. `/panel` (guarded) is the authenticated home — this replaced the old "root = home" setup, so don't assume `/` requires auth when tracing a routing issue.

### RBAC
Permissions live in `core/config/rbac.config.ts`: categories `routes`/`crud`/`dataAccess`/`ui`. Adding a permission = add the key to the `RolePermissions` interface **and** set a value for every role in `ROLE_PERMISSIONS` — a role missing a key is a silent bug, not a compile error. Frontend `*hasPermission`/`canShowUI` only hides UI; row-level data scoping is enforced server-side. Don't treat frontend permission checks as the security boundary. Roles include `regionRepresenter` alongside `districtRepresenter`/`schoolDirector`/`teacher`/`student`/`admin`/`superadmin` — a region-level role added after the original set, backed server-side by expanding `regionId` into that region's district IDs.

### Styling
**Angular Material is fully removed** — not in `package.json`, no `mat-table`/`MatTableDataSource`/`mat-sort`/`mat-paginator` anywhere in `src` (the only surviving reference is a stray `.html.backup` file, dead). All tables, including the stats tabs, use the custom `shared/components/ui/data-table` (`DataTableComponent`) instead — don't reach for Material when working on data-heavy screens, and don't trust older comments/docs that mention `mat-*` selectors. Tailwind is the styling convention everywhere now, not just "new/migrated" areas. ng-bootstrap/bootstrap are gone too (not in `package.json`) — nothing to avoid-by-convention here anymore, they simply don't exist. Dark mode is a real, maintained feature: Tailwind classes get it for free; custom SCSS must use the mixins in `dark-mode-mixins.scss` / `dark-mode-utilities.scss` rather than hand-rolling dark styles. Modal/dropdown z-index convention: backdrop `z-50`, dropdown overlay `z-[90]`, dropdown panel `z-[100]`.

### Subscription cleanup
The repo moved off the manual `OnDestroy` + `Subject` `destroy$` + `takeUntil(destroy$)` pattern — zero files use `destroy$` today. The convention now is `takeUntilDestroyed()` (Angular's `DestroyRef`-based operator, `@angular/core/rxjs-interop`), used in 17+ components; it needs no `OnDestroy` implementation when called in an injection context. Don't reintroduce the old `destroy$` pattern in new code even if you find it referenced in older docs.

### Testing
Existing `.spec.ts` files (39 of them) are mostly Angular CLI boilerplate (`TestBed` setup + a single `should create`, ~27 files have nothing more) with no real assertions. Don't treat passing tests as behavior verification, and don't assume a feature is covered just because a spec file exists for it.

### Stats feature (frequently touched)
`features/stats/components/*-year-tab` are dumb presenters wrapping `DataTableComponent` (`@Input() displayedColumns: string[]`, `TableColumn[]` definitions, no Material); `stats-main/stats.component.ts` is the orchestrator that fetches data (students/teachers/schools/districts/regions) and computes `displayedColumns` per tab. There are also monthly variants (`month-students-tab`, `republic-month-students-tab`, `month-student-rating-table`) and a `developing-students-tab`, alongside the five yearly `*-year-tab` components. Column choice/order is user-configurable via `features/dashboard/components/stats-columns/stats-columns.component.ts`. See `.claude/skills/add-stats-column/SKILL.md` for the full checklist when adding a new column/statistic — it names the exact five places a new column touches (model, column options, table presenter, Excel export, and settings model if it's a new category).

### Recently added features worth knowing exist
- `features/exam-types` (added 2026-09-08) — admin CRUD for exam types/sections/subjects and level scales (`exam-type.service.ts`, `level-scale.service.ts`, `subject.service.ts`), mounted under `/admin/exam-types`, `/admin/subjects`, `/admin/level-scales`. Backs the server-side `exam_types` rollout; see `IMTAHAN_NOVLERI_TASK.md` in the parent directory for the current spec — this is mid-rollout, not finished.
- `features/certificates` — template editor (`/admin/certificates`) and a public, unauthenticated verification page (`/sertifikat/:token`, `CertificateVerifyComponent`) for QR-code certificate lookups.
- `features/regions` — a region tier above districts (`RegionsListComponent`, `region-profile`, `region-editing-dialog`), gated by `canAccessRegions`; region profile itself is reachable without that permission for a `regionRepresenter` viewing their own record, same ownership pattern as district/school/teacher profiles.
- `features/metodika` — public `/metodika` page plus an admin content editor (`/admin/metodika`); content is stored server-side as freeform JSON, so there's no compile-time shape to check against, just what the editor writes.

## Commit style
Short, lowercase, informal prefixes: `fix:`, `feature:`, `bugfix:` — not strictly enforced; plain descriptive messages and occasional non-English messages also appear in history. Match this terse, low-ceremony style rather than imposing Conventional Commits formatting.
