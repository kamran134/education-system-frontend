# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm start` / `ng serve` — dev server at http://localhost:4200
- `ng build` — production build, client-side only (no SSR/prerender — the Dockerfile serves the `browser/` output through nginx, `server.ts` was never used in prod and has been removed; prerendering pre-baked `/login` redirect stubs into every `authGuard`-protected route, since the guard runs without a browser at build time)
- `ng test` — Karma/Jasmine unit tests (see Testing note below before relying on these)
- `ng generate component|service|guard ...` — scaffolding; everything in this repo is standalone (no NgModules)

## Architecture

Standalone Angular 17 app, no NgModules, no NgRx/store. Single flat route table in `src/app/app.routes.ts` (eager by default; only `profile` and `admin` are lazy-loaded). Guards compose as `canActivate: [authGuard, roleGuard('canAccessX')]` — order matters, `authGuard` must run before `roleGuard`. Route keys map 1:1 to `RolePermissions['routes']` in `core/config/rbac.config.ts`.

- `core/services` — cross-cutting: `auth.service.ts` (BehaviorSubject-based session/role state), `permissions.service.ts` (RBAC checks), `excel.service.ts` (xlsx-js-style exports), `config.service.ts` (API base URL).
- `core/models` — one file per domain entity (district/school/student/teacher/exam/...).
- `core/guards`, `core/directives/permissions.directive.ts` (`*hasPermission` / `*hasRole`).
- `features/*` — one directory per domain area (districts, schools, teachers, students, exams, stats, dashboard, ...), each with its own `services/*.service.ts` calling `HttpClient` directly via `ConfigService.getApiUrl()` and unwrapping through `ResponseHandlerUtil.extractData(...)`. There is no shared generic ApiService — this per-feature-service pattern is intentional, follow it rather than introducing a shared HTTP layer.
- `shared/components/ui/*` — use `DialogService` for all dialogs, not Angular Material Dialog directly.

### RBAC
Permissions live in `core/config/rbac.config.ts`: categories `routes`/`crud`/`dataAccess`/`ui`. Adding a permission = add the key to the `RolePermissions` interface **and** set a value for every role in `ROLE_PERMISSIONS` — a role missing a key is a silent bug, not a compile error. Frontend `*hasPermission`/`canShowUI` only hides UI; row-level data scoping is enforced server-side. Don't treat frontend permission checks as the security boundary.

### Styling
Tailwind is the active convention for new/migrated UI (login, admin-layout, stats-columns). Angular Material (`mat-table`, `mat-sort`, `mat-paginator`) is still used in data-heavy areas like the stats tabs — the repo is mid-migration off Material, don't assume one over the other without checking the file. ng-bootstrap/bootstrap are dependencies but effectively unused legacy — don't reach for them in new code. Dark mode is a real, maintained feature: Tailwind classes get it for free; custom SCSS must use the mixins in `dark-mode-mixins.scss` / `dark-mode-utilities.scss` rather than hand-rolling dark styles. Modal/dropdown z-index convention: backdrop `z-50`, dropdown overlay `z-[90]`, dropdown panel `z-[100]`.

### Dialog / subscription cleanup
Dialog-style components with subscriptions must implement `OnDestroy` + `takeUntil(destroy$)` — an established repo-wide convention, not optional cleanup.

### Testing
Existing `.spec.ts` files are mostly Angular CLI boilerplate (`TestBed` setup + a single `should create`) with no real assertions. Don't treat passing tests as behavior verification, and don't assume a feature is covered just because a spec file exists for it.

### Stats feature (frequently touched)
`features/stats/components/*-year-tab` are dumb presenters (`@Input() displayedColumns: string[]` + `MatTableDataSource`); `stats-main/stats.component.ts` is the orchestrator that fetches data and computes `displayedColumns` per tab. Column choice/order is user-configurable via `features/dashboard/components/stats-columns/stats-columns.component.ts`. See `.claude/skills/add-stats-column/SKILL.md` for the full checklist when adding a new column/statistic.

## Commit style
Short, lowercase, informal prefixes: `fix:`, `feature:`, `bugfix:` — not strictly enforced; plain descriptive messages and occasional non-English messages also appear in history. Match this terse, low-ceremony style rather than imposing Conventional Commits formatting.
