# Архитектура фронтенда

Состояние на 23.10.2026. Что делает система в целом, роли, рейтинги и деплой описаны в
документации бэкенда (`docs/` репозитория
[education-system-backend](https://github.com/kamran134/education-system-backend)). Здесь — только
то, что относится к SPA.

## Стек

| | |
|---|---|
| Фреймворк | Angular 21 (`@angular/*` `^21.2`), только standalone-компоненты, без NgModules и без NgRx |
| Стили | Tailwind CSS 3 + SCSS, тёмная тема, свой UI-кит в `shared/components/ui` |
| Иконки | `lucide-angular` |
| Excel | `xlsx-js-style` (экспорт таблиц, отчёт об ошибках импорта) |
| Диалоги | `@angular/cdk` (`Dialog`, overlay) |
| Тесты | Karma/Jasmine, по сути не используются (см. «Ловушки») |

Angular Material, Bootstrap и ng-bootstrap полностью удалены. Таблицы — только
`shared/components/ui/data-table` (`DataTableComponent`). Если старые комментарии упоминают
`mat-*`, это устаревшее.

## Локальный запуск

```bash
npm install
npm start            # ng serve → http://localhost:4200, API на http://localhost:5000/api
```

Бэкенд должен быть запущен (`docs/02-local-setup.md` бэкенда). После правки `angular.json` или
`tsconfig*.json` перезапустите `ng serve`: конфиг сборки он читает один раз при старте.

## Соглашения

- **Маршруты** — одна плоская таблица `src/app/app.routes.ts` плюс админка
  `features/dashboard/dashboard.routes.ts` (lazy, как и `profile`). Гварды:
  `canActivate: [authGuard, roleGuard('canAccessX')]`. Ключ `roleGuard` — это ключ
  `RolePermissions['routes']` в `rbac.config.ts`. Полная таблица маршрутов и матрица прав —
  [roles-and-routes.md](roles-and-routes.md).
- **Новое право** = ключ в интерфейсе `RolePermissions` **и** значение для каждой из 8 ролей в
  `ROLE_PERMISSIONS`. Пропущенная роль не даёт ошибки компиляции, а молча ведёт себя как «нельзя».
- **HTTP** — каждый `features/*/services/*.service.ts` сам вызывает `HttpClient` с базой из
  `ConfigService.getApiUrl()` и разворачивает ответ через `ResponseHandlerUtil.extractData(...)`.
  Общего `ApiService` нет, и вводить его не нужно.
- **Подписки** — `takeUntilDestroyed()`. Паттерн `destroy$` + `takeUntil` не возвращать.
- **Подтверждения** — `ConfirmDialogService`, не `window.confirm`. Внутри cdk `Dialog` — свой
  `ConfirmDialogComponent` (см. «Ловушки», z-index).
- **Тёмная тема** — Tailwind-классы работают сами. Свой SCSS пишется через mixins из
  `src/dark-mode-mixins.scss` и `src/dark-mode-utilities.scss`. Публичные страницы (лендинг,
  `/metodika`) всегда светлые.
- **Шрифты публичных страниц** проверяйте на полный азербайджанский набор `ə Ə ğ ş ç ı İ ö ü`.
  В Trebuchet MS и Georgia нет `ə`, и буква рисуется подставным шрифтом. Текущий стек лендинга:
  `"Segoe UI", system-ui, Verdana, Arial, sans-serif`.
- **Тексты интерфейса** — на азербайджанском. Слово «bal» для рейтинговых очков не используется,
  только «xal». Экзамены называются ежемесячными («aylıq»).
- **Рейтинги (`features/stats`)** — `stats-main/stats.component.ts` загружает данные и решает,
  какие колонки показывать, а вкладки `*-year-tab`, `month-*` — «глупые» обёртки над
  `DataTableComponent`. Колонки настраиваются пользователем (`/admin/rating-columns`,
  `/admin/roles`). Новая колонка трогает пять мест: модель, список колонок, таблицу-презентер,
  Excel-экспорт и (если категория новая) модель настроек. Пошаговый чек-лист —
  `.claude/skills/add-stats-column/SKILL.md`.
- **Скачивание файлов** — `core/utils/blob-download.util.ts`: имя файла из `Content-Disposition`,
  JSON-ошибка из blob-ответа.

## Структура `src/`

```
src/
  main.ts                      bootstrapApplication; на проде console.log/debug/info/warn заглушены
  index.html                   lang="az", шрифт Inter с Google Fonts, <base href="/">
  environments/                environment.ts (dev) и environment.prod.ts (prod, подставляется fileReplacements)
  styles.scss, variables.scss, light-mode.scss, dark-mode*.scss   глобальные стили, mixins тёмной темы
  assets/                      статика (логотипы, og-image)
  app/
    app.component.*            корневой компонент: глобальная шапка/меню, тема, goHome, бейдж pending-изменений
    app.config.ts              provideRouter, provideHttpClient(authInterceptor), GlobalErrorHandler
    app.routes.ts              единая плоская таблица маршрутов
    debug-styles.component.ts  отладочный компонент, нигде не подключён
    demo/                      dialog-showcase, school-dialog-manager (демо, не в роутах)
    core/
      adapters/                пусто
      config/                  rbac.config.ts, owner-roles.config.ts, user-role-labels.config.ts, teacher-grade.config.ts
      directives/              permissions.directive.ts (*hasPermission, *hasRole)
      guards/                  auth.guard.ts, role.guard.ts, admin.guard.ts
      interceptors/            auth.interceptor.ts (Bearer + refresh на 401)
      models/                  по файлу на сущность (district, school, teacher, student, exam, examType, region, settings, ...)
      services/                auth, permissions, config, excel, global-error-handler, navigation-history,
                               profile-change, rating-year, achievement-file
      utils/                   response-handler.util.ts, blob-download.util.ts, academic-year.util.ts, grade-label.util.ts,
                               level-badge.util.ts, score-percent.util.ts, entity-hierarchy.util.ts и др.
    shared/
      components/ui/           свой UI-кит: button, card, confirm-dialog (сервис), data-table, dropdown, form-controls,
                               fullscreen-panel, list-layout, modal, tabs, toast
      components/dialogs/      confirm-dialog (для вызова внутри cdk Dialog)
      components/modals/       bulk-avatar-upload-modal, image-crop-modal
      components/profile/      блоки профилей: entity-card-grid, profile-hero, profile-achievements, profile-achievement-files,
                               profile-rating-section, profile-results-section, profile-stats-section, profile-change-banner
      components/public/       public-header, public-footer (для лендинга и /metodika)
      components/file-upload-errors-dialog, admin-token-stats, user-sessions
      models/                  tableColumn.model.ts, tableColumns.enum.ts
      pipes/                   month-name, month-year, round-number, moment-date-format
      services/                (папка содержит только permissions.directive.ts, дубль директивы из core)
      constants/               пусто
    features/                  по папке на домен; в каждой components/ и services/
```

`features/*`:

| Папка | Что внутри |
|---|---|
| `admin` | Старый `admin-dashboard`, мёртвый код (не в роутах). |
| `auth` | `login` и `register`. |
| `booklets` | Список и деталь буклетов (`/booklets`, публичный `/public/booklets/:id`), диалог редактирования. Раздел скрыт RBAC. |
| `certificates` | Конструктор шаблонов сертификатов (`/admin/certificates*`) и публичная проверка `/sertifikat/:token`. |
| `commonComponents` | Только `snack-bar.service.ts`. |
| `dashboard` | Админка `/admin/*`: layout, пользователи, статистика входов, колонки рейтингов и ролей, модерация профилей, «Silinənlər», legacy-импорт, учебный год, редактор методики. Сервисы, включая `DeletionsService`. Роуты в `dashboard.routes.ts`. |
| `districts` | Список районов, профиль района, диалог редактирования. |
| `exam-results` | Страница результатов экзаменов `/exam-results`. |
| `exam-types` | Админ-CRUD типов экзаменов, предметов, шкал уровней. Сервисы `exam-type`, `level-scale`, `subject`. |
| `exams` | Список экзаменов, диалоги добавления/редактирования, загрузка результатов, загрузка буклетов. |
| `home` | `/panel` (`HomeComponent` с диспетчером ролей) и `profile-header` для owner-ролей. |
| `landing` | Публичный лендинг на `/`. |
| `metodika` | Публичная страница `/metodika` и сервис контента. |
| `profile` | Личный кабинет аккаунта (`/profile`, lazy): личные данные, сессии, смена пароля. |
| `regions` | Список регионов, профиль региона, диалог редактирования. |
| `schools` | Список школ, профиль школы, диалог редактирования. |
| `statistics` | Страница «Statistika» (`/statistics`), дашборд с фильтрами. |
| `stats` | Страница «Reytinqlər» (`/stats`, `/type-ratings`): оркестратор `stats-main`, вкладки по годам и месяцам, `developing-students-tab`, `stats-filters`. |
| `students` | Список учеников, карточка ученика с результатами, диалоги редактирования, `result-editing`. |
| `teachers` | Список учителей, профиль учителя, диалоги редактирования, `teacher-transfer` (перевод в другую школу). |

## Связь с бэкендом и авторизация

**Базовый URL.** Файлы `src/environments/environment.ts` и `environment.prod.ts`. В dev: `apiUrl = http://localhost:5000/api`, `authUrl = http://localhost:5000/api/auth`. В prod (после `fileReplacements`): `apiUrl = '/api'`, `authUrl = '/api/auth'`. То есть прод ходит относительными путями на тот же origin, а `/api` проксирует внешний nginx хоста (внутри контейнера фронта прокси нет). `ConfigService` (`core/services/config.service.ts`) отдаёт `getApiUrl()`, `getAuthUrl()`, `getAssetBaseUrl()` (apiUrl без хвоста `/api`, это origin для `/uploads/...`) и `resolveAssetUrl(url)` (дописывает origin к относительным `/uploads/...`, абсолютные URL не трогает). Каждый feature-сервис (`features/*/services/*.service.ts`) сам вызывает `HttpClient` через `ConfigService.getApiUrl()`, общего `ApiService` нет (так задумано).

**Авторизация на клиенте** (`core/services/auth.service.ts`, `core/interceptors/auth.interceptor.ts`, `core/guards/*`):

- Access-токен хранится в `localStorage` под ключом `token`, там же `id` и `role` (дублируются из ответа `/login`, `/me` и из JWT payload после `refresh`).
- Refresh-токен — httpOnly-кука `refreshToken`, фронт её не читает. Все вызовы авторизации идут с `withCredentials: true`: `POST {authUrl}/login`, `/register`, `/refresh`, `/logout`, `/logout-all`, `GET /sessions`, `GET /me`, `PUT /change-password`, admin-эндпоинты `/admin/token-stats`, `/admin/cleanup-tokens`.
- Состояние сессии: `AuthService` держит `BehaviorSubject`ы `authStatus`, `userId`, `userRole`, `currentUserData` (`UserInfo` из `/me`, включая `profile.entityId` для owner-ролей). `entityId` в `localStorage` не лежит, приходит только из `/me`.
- `authInterceptor` (единственный, подключён в `app.config.ts`): добавляет `Authorization: Bearer <token>` и `withCredentials: true` к каждому запросу. На 401 (кроме URL с `/refresh`, `/login`, `/register`) запускает `AuthService.refreshToken()` один раз, остальные 401 ждут результат через `BehaviorSubject`. После успеха запрос повторяется с новым токеном. Если refresh провалился, вызывается `authService.logout()`.
- `refreshToken()` при 401 проверяет, не обновила ли токен соседняя вкладка (кука ротируется на каждый refresh): сравнивает токен до и после, ждёт 300 мс, и только потом признаёт сессию мёртвой.
- Гварды: `authGuard` (токен + `currentUser` в памяти пропускает сразу; нет токена, пробует `refresh`; есть токен, но нет данных, зовёт `/me`, при ошибке `refresh`), `roleGuard` и `adminGuard` (см. раздел 1). При старте `AppComponent.ngOnInit` дополнительно вызывает `validateToken()`.
- Обработка прочих ошибок: `GlobalErrorHandler` (`core/services/global-error-handler.service.ts`) молча пропускает `HttpErrorResponse` (считает их обработанными в сервисах), chunk-load ошибки логирует как предупреждение, остальное пишет в `console.error`. Показ ошибок пользователю делают сами компоненты (`ToastService`, `SnackBarService`).

**Распаковка ответов.** Через `ResponseHandlerUtil` (`core/utils/response-handler.util.ts`). `extractData<T>()` понимает три формата: `{ success, data }`, `{ data }` и «голые» данные. `null` и `undefined` превращает в `[]`, а не в `null`. `extractPaginatedData<T>()` возвращает `{ data, totalCount }`. Есть также `extractMessage()` и `isSuccess()`. Для файлов: `core/utils/blob-download.util.ts` (`saveBlobResponse` берёт имя из `Content-Disposition`, `blobErrorMessage` достаёт JSON-ошибку из blob).

## Сборка и деплой

**package.json scripts:** `ng`, `start` (`ng serve`), `build` (`ng build`), `watch` (`ng build --watch --configuration development`), `test` (`ng test`, Karma/Jasmine). Линтера и скрипта форматирования нет. В зависимостях остались `@angular/ssr`, `@angular/platform-server`, `express`, но SSR и пререндер не настроены.

**angular.json:**
- Проект `education-system-front`, билдер `@angular-devkit/build-angular:application`, точка входа `src/main.ts`, полифилы `zone.js` и `@angular/localize/init`, стили `src/styles.scss` и `@angular/cdk/overlay-prebuilt.css`, ассеты `src/favicon.ico` и `src/assets`.
- Конфигурация по умолчанию для `build` — `production`: `fileReplacements` подменяет `environment.ts` на `environment.prod.ts`, `outputHashing: all`, `outputPath: dist/education-system-frontend` (в `options` стоит `dist/education-system-front`, но у `production` он переопределён). Бюджеты: `initial` warning 4mb, error 5mb; `anyComponentStyle` warning 2kb, error 6kb.
- Конфигурация `development`: без оптимизации, `sourceMap: true`, `extractLicenses: false`. `serve` по умолчанию использует `development`.
- SSR/prerender в `angular.json` и `tsconfig*.json` не настроены.

**Dockerfile** (двухэтапный): `node:22` — `npm ci`, глобально `@angular/cli`, `ng build --configuration=production`. Затем `nginx:alpine`: `nginx.conf` копируется в `/etc/nginx/conf.d/default.conf`, из билда берётся `/app/dist/education-system-frontend/browser` в `/usr/share/nginx/html`. `EXPOSE 80`. `.dockerignore`: `node_modules`, `dist`, `.git`.

**nginx.conf:** слушает 80 (IPv4/IPv6), `client_max_body_size 100M`, таймауты тела и заголовков по 300 с (массовая загрузка аватаров). `gzip on` (уровень 6, от 1024 байт, типы js/css/json/svg/шрифты). Кеш: `location = /index.html` отдаётся с `no-cache`; хешированные бандлы по регулярке `-[A-Z0-9]{8}\.(js|css)$` с `public, max-age=31536000, immutable`; изображения и шрифты по расширению с `max-age=604800` (7 дней); всё остальное `try_files $uri $uri/ /index.html` (SPA-фолбэк). `error_page 500 502 503 504` на `/50x.html`. TLS, HTTP/2 и проксирование `/api` живут на внешнем nginx хоста, не здесь.

**CI** (единственный файл `.github/workflows/docker.yml`, «Deploy Frontend to GHCR»): триггер — push в ветку `main`. `concurrency: group deploy-frontend`, `cancel-in-progress: false` (защита только от гонки внутри этого репозитория). Единственный job `build-and-push` на `ubuntu-latest`, шаги:
1. `actions/checkout@v4`.
2. Вход в GHCR (`docker login ghcr.io`), секрет `GHCR_PAT`.
3. `docker build -t ghcr.io/kamran134/education-system-frontend:latest .`
4. `docker push` того же образа (только тег `latest`).
5. Запись SSH-ключа во временный файл `deploy_key` (секрет `SSH_PRIVATE_KEY`).
6. Деплой по SSH (секреты `SERVER_USER`, `SERVER_HOST`): на сервере `flock -w 600 /tmp/isim-deploy.lock -c 'cd ~/isim && docker compose pull frontend && docker compose up -d frontend'`.

Используемые имена секретов: `GHCR_PAT`, `SSH_PRIVATE_KEY`, `SERVER_USER`, `SERVER_HOST`.

Общий замок: да, `flock` на `/tmp/isim-deploy.lock`, ждёт до 600 секунд. Тот же файл замка использует воркфлоу бэкенда: оба гоняют `docker compose` над одним проектом `~/isim`. `concurrency` в GitHub Actions между репозиториями не работает, поэтому замок серверный. В CI нет шагов `ng test` и линтера: сборка `ng build --configuration=production` внутри Docker — единственная проверка. Пуш в `main` сразу деплоит на прод.

## Ловушки

1. **Нет SSR и пререндера.** `ng build` — только клиентская сборка. Прежний пререндер запёк в каждый защищённый `authGuard` маршрут заглушку-редирект на `/login`. Не возвращать SSR/prerender. `server.ts` удалён, но `@angular/ssr`, `express`, `platform-server` ещё в `package.json`. (`CLAUDE.md`, `angular.json`, `Dockerfile`)
2. **Ключ RBAC, не заданный для роли, — тихий баг, а не ошибка компиляции.** Новое право нужно добавить в `RolePermissions` и в каждую из 8 ролей в `ROLE_PERMISSIONS`, иначе `RbacService` вернёт `undefined` и `canShowUI`/`roleGuard` будут вести себя как «нельзя». (`src/app/core/config/rbac.config.ts`)
3. **Мёртвые UI-флаги.** `showRatingColumnsLink`, `showStatsUpdateButton`, `showBulkActions`, `showExportButtons` нигде не читаются. Менять их значения бессмысленно, а видимость экспорта и массовых действий определяется проверками в самих компонентах. Также `canAccessAdminPanel=true` у всех, но им никто не пользуется: реальный гейт `/admin/*` — это `adminGuard`. (`rbac.config.ts`, `grep` по `src/app`)
4. **`/statistics` защищён только `authGuard`.** В RBAC `canAccessStatistics=false` для `student`, а в `statistics-main.component.ts` комментарий утверждает, что «`roleGuard` закрывает роут раньше», но в `app.routes.ts` у роута `roleGuard` нет. Студент может открыть страницу по прямому URL. Скрыт только пункт меню. Аналогично `/exam-results` (без `roleGuard` намеренно) и `/profile`. (`src/app/app.routes.ts`)
5. **Профили не закрыты `roleGuard`.** `regions|districts|schools|teachers/:id/profile` открыты любому авторизованному: владение проверяет компонент (`canEdit`) и бэкенд (`canManageOwnEntity`). Не добавлять туда `roleGuard('canAccessX')`, иначе owner-роли потеряют свой профиль. Так же `/panel` не гвард, а компонент-диспетчер: `profile.entityId` приходит только из `GET /auth/me`, гвард читал бы `undefined` на холодной загрузке. Комментарий в `role.guard.ts` про «authGuard отрабатывает первым» неверен: гварды одного `canActivate` подписываются параллельно, поэтому `roleGuard` возвращает `UrlTree`, а не вызывает `navigate()`. (`app.routes.ts`, `features/home/components/home/home.component.ts`, `core/guards/role.guard.ts`)
6. **`admin` не может редактировать экзамены.** `canEditExams` есть только у `superadmin`, при этом `canCreateExams` и `canDeleteExams` у `admin` есть. `moderator` может создавать экзамены, но не может ни править, ни удалять их. Похоже на недосмотр. `moderator` также блокируется `adminGuard` во всех `/admin/*`, хотя в меню «İdarəetmə» ему и так ничего не видно. (`rbac.config.ts`, `exams-list.component.ts`)
7. **Диалоги подтверждения и z-index.** Обычное подтверждение — `ConfirmDialogService` (overlay `z-[300]`). Внутри cdk `Dialog` (контейнер overlay с `z-index: 1000`) он окажется под диалогом, поэтому там открывать `shared/components/dialogs/confirm-dialog/ConfirmDialogComponent` через `Dialog` (ключ данных `text`, не `message`). Остальное: backdrop модалки `z-50`, overlay dropdown `z-[90]`, панель dropdown `z-[100]`. Не использовать `window.confirm`. (`CLAUDE.md`, `shared/components/ui/confirm-dialog/confirm-dialog.service.ts`)
8. **Тёмная тема.** Это поддерживаемая функция. Tailwind-классы работают сами, а свои SCSS обязаны использовать mixins из `src/dark-mode-mixins.scss` и `src/dark-mode-utilities.scss`. Лендинг и `/metodika` всегда светлые (`isPublicBrandRoute` в `AppComponent.setMode()`). Бюджет `anyComponentStyle` жёсткий: error при 6kb на стиль компонента (`angular.json`).
9. **Каждый feature-сервис ходит в API сам, а ответ нужно разворачивать `ResponseHandlerUtil.extractData`.** Он превращает `null`/`undefined` в `[]`, а не в `null`, поэтому «пустого» объекта от него не дождаться. Общий `ApiService` не вводить (осознанное решение). (`core/utils/response-handler.util.ts`, `CLAUDE.md`)
10. **Подписки через `takeUntilDestroyed()`.** Старый паттерн `destroy$` + `takeUntil` не возвращать (ни одного файла с ним нет). Material, bootstrap и ng-bootstrap удалены, таблицы только через `shared/components/ui/data-table`. Файлы `.html.backup` — мёртвые. Старые `.md` в корне (`DARK_MODE_STATUS.md`, `RBAC_GUIDE.md`, `UI_REDESIGN.md` и др.) — рабочие заметки прошлых этапов, частично устарели; актуальны `README.md`, `docs/` и `CLAUDE.md`. `NOTES_DEV.md` в `.gitignore` и в репозиторий не попадёт. (`CLAUDE.md`)
11. **Тесты — заглушки.** Из 39 `.spec.ts` большинство — шаблон Angular CLI с одним `should create` без проверок. Зелёный `ng test` ничего не доказывает, и в CI тесты не запускаются: проверка сборкой в Docker. (`CLAUDE.md`, `.github/workflows/docker.yml`)
12. **Кеш nginx и деплой.** Нехешированные имена в `assets/` не меняются при обновлении, поэтому TTL у них 7 дней, а `index.html` всегда `no-cache`: не удлинять TTL для `assets/`. Деплой идёт при каждом push в `main`, параллельные пуши фронта и бэкенда сериализуются `flock` на сервере, но раскатывать их одновременно всё равно не стоит. Запись в `localStorage` ключей `token`/`id`/`role` и 401-рефреш общие для всех вкладок: не менять логику `refreshToken()` без учёта гонки ротации куки между вкладками. (`nginx.conf`, `.github/workflows/docker.yml`, `core/services/auth.service.ts`)
