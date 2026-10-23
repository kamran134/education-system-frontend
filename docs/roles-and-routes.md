# Маршруты, роли и права

Состояние на 23.10.2026. Источники: `src/app/app.routes.ts`, `src/app/features/dashboard/dashboard.routes.ts`,
`src/app/core/config/rbac.config.ts`, `src/app/core/guards/*`, `app.component.html`,
`features/home/components/home/home.component.ts`.

> Всё описанное здесь — видимость в интерфейсе. Какие данные получит пользователь, решает бэкенд
> (role-скоупинг, см. `docs/03-architecture.md` в репозитории бэкенда). Фронтенд-проверки не
> являются защитой.

## 1. Маршруты

Расшифровка гвардов:

- `authGuard` (`src/app/core/guards/auth.guard.ts`) пропускает любого, у кого есть токен или кто смог сделать `refresh`. Иначе делает `navigate(['/login'])`. Роль не проверяет.
- `roleGuard('key')` (`core/guards/role.guard.ts`) смотрит `RolePermissions['routes'][key]` для роли из `AuthService`. Если нельзя, возвращает `UrlTree('/panel')`. Роли по каждому ключу — в матрице раздела 2.
- `adminGuard` (`core/guards/admin.guard.ts`) пропускает только роли `admin` и `superadmin` (`AuthService.isAdminOrSuperAdmin()`). `moderator` не проходит. Остальным редирект на `/panel`. Если токена нет или он невалиден, редирект на `/login`.
- `canDeactivate: confirmLeaveExamTypeEditor` вызывает `ExamTypeEditorComponent.confirmLeave()`. Это диалог о несохранённых правках.

Сокращения ролей: super = superadmin, admin, moder = moderator, region = regionRepresenter, district = districtRepresenter, director = schoolDirector, teacher, student.

### 1.1. `src/app/app.routes.ts`

| Путь | Компонент (файл) | Гварды | Для кого / что на экране |
|---|---|---|---|
| `''` | `LandingComponent` (`features/landing/landing.component.ts`) | нет | Публичный лендинг (витрина). Своя шапка, глобальная шапка скрыта (`isPublicBrandRoute`). |
| `metodika` | `MetodikaComponent` (`features/metodika/metodika.component.ts`) | нет | Публичная страница «İSİM metodikası». Контент приходит с бэка как свободный JSON. |
| `panel` | `HomeComponent` (`features/home/components/home/home.component.ts`) | `authGuard` | «Мой дом». teacher, director, district, region сразу уезжают на свой профиль (`HOME_BY_ROLE`). Остальные видят сетку карточек разделов (раздел 2). |
| `regions` | `RegionsListComponent` (`features/regions/components/regions-list/`) | `authGuard`, `roleGuard('canAccessRegions')` | Список региональных управлений (РТИ). Роли: super, admin, moder. |
| `regions/:id/districts` | `DistrictsListComponent` | `authGuard`, `roleGuard('canAccessRegions')` | Районы выбранного региона. Роли: super, admin, moder. |
| `regions/:id/profile` | `RegionProfileComponent` (`features/regions/components/region-profile/`) | `authGuard` | Профиль региона. `roleGuard` не стоит намеренно: region видит свой профиль при `canAccessRegions=false`. Владение проверяют компонент и бэкенд. |
| `districts` | `DistrictsListComponent` (`features/districts/components/districts-list/`) | `authGuard`, `roleGuard('canAccessDistricts')` | Список районов (Təhsil sektorları). Роли: super, admin, moder, region. |
| `districts/:id/schools` | `SchoolsListComponent` | `authGuard`, `roleGuard('canAccessDistricts')` | Школы района. Те же роли. |
| `districts/:id/profile` | `DistrictProfileComponent` (`features/districts/components/district-profile/`) | `authGuard` | Профиль района. Любой авторизованный, владение проверяется в компоненте и на бэкенде. Домашняя страница для district. |
| `schools` | `SchoolsListComponent` (`features/schools/components/schools-list/`) | `authGuard`, `roleGuard('canAccessSchools')` | Список школ. Роли: super, admin, moder, district, region. |
| `schools/:id/teachers` | `TeachersListComponent` | `authGuard`, `roleGuard('canAccessSchools')` | Учителя школы. Те же роли, что у `/schools`. |
| `schools/:id/profile` | `SchoolProfileComponent` (`features/schools/components/school-profile/`) | `authGuard` | Профиль школы. Домашняя страница для director. |
| `teachers` | `TeachersListComponent` (`features/teachers/components/teachers-list/`) | `authGuard`, `roleGuard('canAccessTeachers')` | Список учителей (Layihə müəllimləri). Роли: super, admin, moder, district, director, region. Не teacher и не student. |
| `teachers/:id/students` | `StudentsListComponent` | `authGuard`, `roleGuard('canAccessTeachers')` | Ученики учителя. Те же роли. |
| `teachers/:id/profile` | `TeacherProfileComponent` (`features/teachers/components/teacher-profile/`) | `authGuard` | Профиль учителя. Домашняя страница для teacher. Тут же диалог `teacher-transfer` («Başqa məktəbə köçür»). |
| `students` | `StudentsListComponent` (`features/students/components/students-list/`) | `authGuard`, `roleGuard('canAccessStudents')` | Список учеников (Şagirdlər). Роли: все 8 (`student` видит только себя, область данных режет бэкенд). |
| `students/:id` | `StudentDetailsComponent` (`features/students/components/student-details/`) | `authGuard`, `roleGuard('canAccessStudents')` | Карточка ученика, результаты, скачивание сертификата. Роли: все 8. Для student это фактическая домашняя страница. |
| `exams` | `ExamsListComponent` (`features/exams/components/exams-list/`) | `authGuard`, `roleGuard('canAccessExams')` | Список экзаменов. Ключ даёт доступ всем 8 ролям, но карточка на `/panel` и права CRUD только у super, admin, moder (подробности в разделе 2). |
| `booklets` | `BookletsListComponent` (`features/booklets/components/booklets-list/`) | `authGuard`, `roleGuard('canAccessBooklets')` | Kitabçalar. `canAccessBooklets=false` у всех ролей (заказчик попросил скрыть 2026-08-08), то есть недоступен никому. |
| `public/booklets/:id` | `BookletDetailComponent` | нет | Публичная страница буклета. |
| `sertifikat/:token` | `CertificateVerifyComponent` (`features/certificates/components/certificate-verify/`) | нет | Публичная проверка сертификата по QR (намеренно без гварда). Своя мини-шапка. |
| `exam-results` | `ExamResultsComponent` (`features/exam-results/components/exam-results.component.ts`) | `authGuard` | Результаты экзаменов. Открыт любому авторизованному, `roleGuard` нет намеренно. В меню виден всем кроме student. |
| `stats` | `StatsComponent` (`features/stats/components/stats-main/stats.component.ts`) | `authGuard`, `roleGuard('canAccessStats')` | «Reytinqlər», вкладки по регионам/районам/школам/учителям/ученикам. Роли: все 8. |
| `type-ratings` | `StatsComponent` (тот же) с `data: { examTypeSelectable: true }` | `authGuard`, `roleGuard('canAccessStats')` | Те же рейтинги, но с выбором типа экзамена. Роли: все 8. |
| `statistics` | `StatisticsMainComponent` (`features/statistics/components/statistics-main/`) | `authGuard` (без `roleGuard`) | «Statistika». В RBAC `canAccessStatistics=false` у student, но на роуте гварда нет, см. [architecture.md](architecture.md#ловушки). |
| `profile` (lazy) | `PROFILE_ROUTES` → `UserProfileComponent` (`features/profile/user-profile.component.ts`), title `İstifadəçi Profili` | `authGuard` | Личные данные аккаунта (вкладки «Şəxsi məlumatlar», «Sessiyalar»), смена пароля. Любой авторизованный. |
| `admin` (lazy) | `routes` из `features/dashboard/dashboard.routes.ts` | `authGuard` на родителе | Админка, см. 1.2. Родитель пускает любого авторизованного, а реальный гейт стоит на каждом дочернем пути. |
| `login` | `LoginComponent` (`features/auth/components/login/`) | нет | Вход. |
| `register` | `RegisterComponent` (`features/auth/register/register/`) | нет | Регистрация. |
| `**` | redirect `''` | нет | Любой неизвестный путь ведёт на лендинг. |

### 1.2. `features/dashboard/dashboard.routes.ts` (под `/admin`)

Родитель — `AdminLayoutComponent` (`features/dashboard/components/admin-layout/`): своя шапка и боковое меню, глобальная шапка для `/admin*` скрыта (`hasOwnHeader`). Все дочерние пути закрыты `adminGuard`, то есть проходят только `admin` и `superadmin`. `moderator` не проходит ни одного.

| Путь | Компонент | Гварды | Что на экране |
|---|---|---|---|
| `/admin/users` | `UsersComponent` | `adminGuard` | Управление пользователями, диалог `user-edit-dialog`. |
| `/admin/login-stats` | `LoginStatsComponent` | `adminGuard` | Статистика входов и онлайна (`GET /api/users/activity-stats`). |
| `/admin/rating-columns` | `StatsColumnsComponent` | `adminGuard` | Настройка колонок рейтингов. Это путь по умолчанию: `''` редиректит сюда. |
| `/admin/profile-changes` | `ProfileChangesComponent` | `adminGuard` | «Təsdiq gözləyən məlumatlar», модерация изменений профилей и файлов в Uğurlar. |
| `/admin/deleted` | `DeletedItemsComponent` | `adminGuard` | «Silinənlər». Просмотр и восстановление мягко удалённых районов, школ, учителей, учеников. |
| `/admin/roles` | `RolesColumnsComponent` | `adminGuard` | Колонки по ролям (то, что хранится в `user_settings.role_settings`). |
| `/admin/legacy-import` | `LegacyImportComponent` | `adminGuard` | Импорт из старой базы. |
| `/admin/academic-year` | `AcademicYearComponent` | `adminGuard` | Архив и закрытие учебных годов. |
| `/admin/metodika` | `MetodikaEditorComponent` | `adminGuard` | Редактор контента публичной `/metodika`. |
| `/admin/certificates` | `CertificateTemplatesListComponent` | `adminGuard` | Список шаблонов сертификатов. |
| `/admin/certificates/:id` | `CertificateEditorComponent` | `adminGuard` | Конструктор сертификата. |
| `/admin/exam-types` | `ExamTypesListComponent` | `adminGuard` | Типы экзаменов. |
| `/admin/exam-types/new`, `/admin/exam-types/:id` | `ExamTypeEditorComponent` | `adminGuard`, `canDeactivate: confirmLeaveExamTypeEditor` | Редактор типа экзамена. Правки без сохранения спрашивают подтверждение при уходе. |
| `/admin/subjects` | `SubjectsListComponent` | `adminGuard` | Справочник предметов. |
| `/admin/level-scales` | `LevelScalesViewComponent` | `adminGuard` | Просмотр шкал уровней (pillə). |
| `/admin` (пустой) | redirect → `rating-columns` | — | — |

Меню админки скрывает пункты по `canAccessRoute(...)` и `isAdminOrSuperAdmin$`, но ключи там примерно те же, что у `adminGuard`: фактически видят всё только admin и superadmin.

Файл `features/admin/admin-dashboard.component.*` ни в одном роуте и ни в одном шаблоне не используется (мёртвый код). Так же `debug-styles.component.ts` и `demo/*` не подключены к роутам.

---

## 2. Роли и права

Роли (`UserRole` в `src/app/core/config/rbac.config.ts`): `superadmin`, `admin`, `moderator`, `regionRepresenter`, `districtRepresenter`, `schoolDirector`, `teacher`, `student`. Все 8 заполнены во всех категориях, пропусков нет (матрица ниже сгенерирована скриптом из `ROLE_PERMISSIONS`, значения `undefined` не найдены).

Колонки: super = superadmin, admin, moder = moderator, region = regionRepresenter, district = districtRepresenter, director = schoolDirector, teacher, student.

### 2.1. routes

| Ключ | super | admin | moder | region | district | director | teacher | student |
|---|---|---|---|---|---|---|---|---|
| canAccessAdminPanel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canAccessCertificates | ✓ | ✓ | — | — | — | — | — | — |
| canAccessUserManagement | ✓ | ✓ | — | — | — | — | — | — |
| canAccessRatingColumns | ✓ | ✓ | — | — | — | — | — | — |
| canAccessProfileChanges | ✓ | ✓ | — | — | — | — | — | — |
| canAccessDeletedItems | ✓ | ✓ | — | — | — | — | — | — |
| canAccessProfile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canAccessStats | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canAccessStatistics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| canAccessRegions | ✓ | ✓ | ✓ | — | — | — | — | — |
| canAccessDistricts | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| canAccessSchools | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| canAccessTeachers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| canAccessStudents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canAccessExams | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canAccessBooklets | — | — | — | — | — | — | — | — |

### 2.2. crud

| Ключ | super | admin | moder | region | district | director | teacher | student |
|---|---|---|---|---|---|---|---|---|
| canCreateUsers | ✓ | ✓ | — | — | — | — | — | — |
| canEditUsers | ✓ | ✓ | — | — | — | — | — | — |
| canDeleteUsers | ✓ | ✓ | — | — | — | — | — | — |
| canCreateRegions | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditRegions | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteRegions | ✓ | ✓ | — | — | — | — | — | — |
| canCreateDistricts | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditDistricts | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteDistricts | ✓ | ✓ | — | — | — | — | — | — |
| canCreateSchools | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditSchools | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteSchools | ✓ | ✓ | — | — | — | — | — | — |
| canCreateTeachers | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditTeachers | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteTeachers | ✓ | ✓ | — | — | — | — | — | — |
| canCreateStudents | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditStudents | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteStudents | ✓ | ✓ | — | — | — | — | — | — |
| canCreateExams | ✓ | ✓ | ✓ | — | — | — | — | — |
| canEditExams | ✓ | — | — | — | — | — | — | — |
| canDeleteExams | ✓ | ✓ | — | — | — | — | — | — |
| canEditExamResults | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteExamResults | ✓ | ✓ | — | — | — | — | — | — |
| canEditBooklets | ✓ | ✓ | ✓ | — | — | — | — | — |
| canDeleteBooklets | ✓ | ✓ | — | — | — | — | — | — |

### 2.3. dataAccess

| Ключ | super | admin | moder | region | district | director | teacher | student |
|---|---|---|---|---|---|---|---|---|
| seeAllRegions | ✓ | ✓ | ✓ | — | — | — | — | — |
| seeOwnRegionOnly | — | — | — | ✓ | — | — | — | — |
| seeAllDistricts | ✓ | ✓ | ✓ | — | — | — | — | — |
| seeOwnDistrictOnly | — | — | — | — | ✓ | — | — | — |
| seeAllSchools | ✓ | ✓ | ✓ | — | — | — | — | — |
| seeOwnSchoolOnly | — | — | — | — | — | ✓ | — | — |
| seeAllTeachers | ✓ | ✓ | ✓ | — | — | — | — | — |
| seeOwnTeachersOnly | — | — | — | — | — | — | ✓ | — |
| seeAllStudents | ✓ | ✓ | ✓ | — | — | — | — | — |
| seeOwnStudentsOnly | — | — | — | — | — | — | — | ✓ |

Это только метки для фронта. Реальную фильтрацию данных делает бэкенд. У `regionRepresenter` нет `seeAll*`/`seeOwn*` для районов/школ/учителей/учеников. Область региона бэкенд раскрывает через `regionId` в список районов.

### 2.4. ui

| Ключ | super | admin | moder | region | district | director | teacher | student |
|---|---|---|---|---|---|---|---|---|
| showAdminMenu | ✓ | ✓ | — | — | — | — | — | — |
| showUserManagementLink | ✓ | ✓ | — | — | — | — | — | — |
| showRatingColumnsLink | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| showStatsUpdateButton | ✓ | ✓ | — | — | — | — | — | — |
| showExportButtons | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| showBulkActions | ✓ | ✓ | — | — | — | — | — | — |
| showRegionsSection | ✓ | ✓ | ✓ | — | — | — | — | — |
| showDistrictsSection | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| showSchoolsSection | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| showTeachersSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| showStudentsSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| showExamsSection | ✓ | ✓ | ✓ | — | — | — | — | — |
| showBookletsSection | — | — | — | — | — | — | — | — |
| showStatsSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| showRegionsTab | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| showDistrictsTab | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| showSchoolsTab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| showTeachersTab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| showStudentsTab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canManageTeacherPhotos | ✓ | ✓ | ✓ | — | — | ✓ | — | — |
| canManageStudentPhotos | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |

Флаги `showRatingColumnsLink`, `showStatsUpdateButton`, `showBulkActions`, `showExportButtons` нигде в шаблонах и коде не читаются (grep по `src/app` находит их только в `rbac.config.ts` и в комментарии директивы). Это мёртвые флаги: менять их значения бессмысленно. Экспорт каталогов в Excel гейтится отдельными проверками в компонентах (admin/superadmin), а не этим флагом.

### 2.5. Как выбирается шапка и домашняя страница

- `/panel` (`HomeComponent`) подписывается на `AuthService.currentUser$`. Для `teacher`, `schoolDirector`, `districtRepresenter`, `regionRepresenter` с непустым `profile.entityId` делает `router.navigate(..., { replaceUrl: true })` на `/teachers|schools|districts|regions/:entityId/profile`. Для ролей без сущности, для `student` и для учёток без привязки (`entityId == null`) показывает сетку карточек. Это сделано намеренно не гвардом (`entityId` приходит только из `GET /auth/me`).
- Логотип и иконка домика в шапке ведут на `/panel` для авторизованных и на `/` для гостей (`AppComponent.goHome()`).
- «Owner roles» (`core/config/owner-roles.config.ts`): `student`, `teacher`, `schoolDirector`, `districtRepresenter`, `regionRepresenter`. Для них шапка сворачивается в одно выпадающее меню с именем сущности. Пункты: «Reytinqlər», «Statistika» (скрыт для student), «İmtahan nəticələri» (скрыт для student), «Çıxış et». Для остальных (`superadmin`, `admin`, `moderator`) шапка полная: меню «Bölmələr», «İdarəetmə» (только если `showAdminMenu`) и «Profil».
- Меню «Bölmələr» (`app.component.html`): «Reytinqlər», «Statistika», «İmtahan nəticələri» (без условия по роли), «Regional idarələr», «Təhsil sektorları», «Məktəblər», «Layihə müəllimləri», «Şagirdlər», каждый по `canAccessRoute(...)`. Пункта для «İmtahanlar» (`/exams`) и для `/type-ratings` в меню нет, они есть только карточками на `/panel`.
- Меню «İdarəetmə» (`showAdminMenu`): «İstifadəçilər», «Reytinq sütunları», «Təsdiq gözləyən məlumatlar» (с красным бейджем), «Silinənlər», «Admin paneli» (только `permissions.isAdmin()`, то есть admin или superadmin).
- Карточки на `/panel` по ключам `show*Section`: «Regional Təhsil İdarələri», «Təhsil sektorları», «Məktəblər», «Layihə müəllimləri», «Şagirdlər», «İmtahanlar» и «İmtahan nəticələri» (оба по `showExamsSection`), «Kitabçalar» (`showBookletsSection`, ни у кого нет), и три карточки по `showStatsSection`: `/stats`, `/statistics`, `/type-ratings`.

### 2.6. Что видит и может каждая роль

**superadmin.** Домашняя страница — сетка карточек на `/panel` (все разделы, кроме Kitabçalar). Полная шапка с «İdarəetmə» и «Admin paneli», доступны все `/admin/*`. Может создавать, править и удалять (мягко) всё: районы, школы, учителей, учеников, результаты, пользователей. Единственная роль с `canEditExams`.

**admin.** То же, что superadmin: сетка на `/panel`, полная шапка, вся админка, CRUD по всем сущностям. Отличие от superadmin только одно: `canEditExams=false`. Это похоже на недосмотр, а не на решение (`ExamsListComponent` прячет действие редактирования экзамена за `authService.canEditExams()`). Создавать и удалять экзамены admin может.

**moderator.** Домашняя страница — сетка на `/panel` (регионы, районы, школы, учителя, ученики, экзамены, результаты, рейтинги). Видит все данные (`seeAll*`). Может создавать и редактировать регионы, районы, школы, учителей, учеников, экзамены, результаты, буклеты, управлять фото учителей и учеников. Отличия от admin: нет удаления ни для чего, нет `canEditExams`, нет `showAdminMenu`, нет ни одного `/admin/*` (`adminGuard` не пропускает, а `canAccessProfileChanges`, `canAccessDeletedItems`, `canAccessUserManagement` и `canAccessCertificates` — `false`). То есть модератор не участвует в модерации профилей и не видит «Silinənlər». Меню «İdarəetmə» и «Admin paneli» у него отсутствуют.

**regionRepresenter.** Owner-роль: `/panel` сразу перекидывает на `/regions/:entityId/profile`. Шапка сжата в одно меню с названием региона («Reytinqlər», «Statistika», «İmtahan nəticələri», «Çıxış et»). Список районов региона (`/districts`) и школ доступен, список регионов (`/regions`) нет. Редактировать записи через общий RBAC не может, правит только свой профиль (проверка владения в компоненте и на бэкенде), фото баннера загружает сам через `ProfileHeaderComponent`.

**districtRepresenter.** Owner-роль: `/panel` ведёт на `/districts/:entityId/profile`. Видит школы и учителей своего района, учеников, рейтинги, статистику (фильтр района заблокирован). Правит только свой профиль и загружает фото-баннер. Списка районов и регионов не видит.

**schoolDirector.** Owner-роль: `/panel` ведёт на `/schools/:entityId/profile`. Видит учителей и учеников своей школы, рейтинги, статистику. Единственная из owner-ролей, кто управляет фото учителей и учеников своей школы (`canManageTeacherPhotos`, `canManageStudentPhotos`). Списка школ не видит (`canAccessSchools=false`), своя школа доступна через профиль.

**teacher.** Owner-роль: `/panel` ведёт на `/teachers/:entityId/profile`. Видит своих учеников (`/students`), их результаты, рейтинги, статистику. Может управлять фото своих учеников. Списка учителей не видит, `/teachers/:id/profile` доступен для своей записи.

**student.** Owner-роль, но в `HOME_BY_ROLE` его нет: `/panel` показывает сетку с карточкой «Şagirdlər» и блоком профиля (`ProfileHeaderComponent`), а не редирект. Сжатая шапка без «Statistika» и «İmtahan nəticələri». Видит только себя (`/students`, `/students/:id`, там же скачивание своих сертификатов), рейтинги. `canAccessStatistics=false`, но роут без `roleGuard`, см. [architecture.md](architecture.md#ловушки).
