# RBAC System - Role-Based Access Control

## Обзор

Система управления доступом на основе ролей (RBAC) централизованно управляет правами пользователей в приложении.

## Структура

```
src/app/core/
├── config/
│   └── rbac.config.ts          # Конфигурация прав для каждой роли
├── services/
│   └── permissions.service.ts  # Angular сервис для работы с правами
└── directives/
    └── permissions.directive.ts # Директивы для шаблонов
```

## Роли в системе

1. **superadmin** - полный доступ ко всему
2. **admin** - администратор системы
3. **districtRepresenter** - представитель района
4. **schoolDirector** - директор школы
5. **teacher** - учитель
6. **student** - ученик

## Категории прав

### 1. Routes (Маршруты)
Определяет доступ к страницам приложения.

```typescript
routes: {
    canAccessAdminPanel: boolean;
    canAccessUserManagement: boolean;
    canAccessRatingColumns: boolean;
    canAccessProfile: boolean;
    canAccessStats: boolean;
    // и т.д.
}
```

### 2. CRUD (Операции)
Определяет права на создание, редактирование, удаление.

```typescript
crud: {
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    // и т.д.
}
```

### 3. Data Access (Доступ к данным)
Определяет какие данные видит пользователь.

```typescript
dataAccess: {
    seeAllDistricts: boolean;
    seeOwnDistrictOnly: boolean;
    seeAllSchools: boolean;
    // и т.д.
}
```

### 4. UI (Элементы интерфейса)
Определяет видимость кнопок, меню и других UI элементов.

```typescript
ui: {
    showAdminMenu: boolean;
    showUserManagementLink: boolean;
    showStatsUpdateButton: boolean;
    // и т.д.
}
```

## Использование в коде

### В TypeScript компонентах

```typescript
import { PermissionsService } from '@core/services/permissions.service';

export class MyComponent {
    constructor(private permissions: PermissionsService) {}

    ngOnInit() {
        // Проверить доступ к маршруту
        if (this.permissions.canAccessRoute('canAccessUserManagement')) {
            // Разрешено
        }

        // Проверить CRUD операцию
        if (this.permissions.canPerformCrud('canCreateUsers')) {
            // Может создавать пользователей
        }

        // Проверить видимость UI элемента
        if (this.permissions.canShowUI('showExportButtons')) {
            // Показать кнопки экспорта
        }

        // Проверить доступ к данным
        if (this.permissions.hasDataAccess('seeAllDistricts')) {
            // Видит все районы
        }

        // Проверить является ли админом
        if (this.permissions.isAdmin()) {
            // Это админ
        }
    }
}
```

### В HTML шаблонах

```html
<!-- Показать элемент только если есть право -->
<button *hasPermission="'canAccessUserManagement'; hasPermissionCategory: 'routes'">
    Управление пользователями
</button>

<!-- Показать форму создания только если есть право -->
<div *hasPermission="'canCreateUsers'; hasPermissionCategory: 'crud'">
    <form>...</form>
</div>

<!-- Показать кнопку только если видимость разрешена -->
<button *hasPermission="'showExportButtons'; hasPermissionCategory: 'ui'">
    Экспорт
</button>

<!-- Показать только админам -->
<div *hasRole="['admin', 'superadmin']">
    Админский контент
</div>
```

### В Guards (охранниках маршрутов)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions.service';

export const userManagementGuard: CanActivateFn = () => {
    const permissions = inject(PermissionsService);
    const router = inject(Router);

    if (!permissions.canAccessRoute('canAccessUserManagement')) {
        router.navigate(['/']);
        return false;
    }

    return true;
};
```

## Примеры для разных сценариев

### Пример 1: Кнопка "Создать пользователя"

```html
<!-- Старый способ -->
<button *ngIf="isAdminOrSuperAdmin()">
    Создать пользователя
</button>

<!-- Новый способ через RBAC -->
<button *hasPermission="'canCreateUsers'; hasPermissionCategory: 'crud'">
    Создать пользователя
</button>
```

### Пример 2: Меню администратора

```html
<!-- Старый способ -->
<app-dropdown *ngIf="isAuthorized() && isAdminOrSuperAdmin()">
    <!-- Меню -->
</app-dropdown>

<!-- Новый способ через RBAC -->
<app-dropdown *hasPermission="'showAdminMenu'; hasPermissionCategory: 'ui'">
    <!-- Меню -->
</app-dropdown>
```

### Пример 3: Условная навигация

```typescript
goToUsers(): void {
    if (!this.permissions.canAccessRoute('canAccessUserManagement')) {
        this.snackBar.open('У вас нет доступа к этой странице', 'OK');
        return;
    }
    this.router.navigate(['/admin/users']);
}
```

## Как добавить новое право

### 1. Добавить в интерфейс RolePermissions

```typescript
// В rbac.config.ts
export interface RolePermissions {
    routes: {
        // ... существующие
        canAccessNewFeature: boolean;  // <- новое право
    };
}
```

### 2. Добавить во все роли

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    superadmin: {
        routes: {
            // ... существующие
            canAccessNewFeature: true,
        },
    },
    admin: {
        routes: {
            // ... существующие
            canAccessNewFeature: true,
        },
    },
    // ... и т.д. для всех ролей
};
```

### 3. Использовать в коде

```typescript
if (this.permissions.canAccessRoute('canAccessNewFeature')) {
    // Ваш код
}
```

## Миграция существующего кода

### До:
```typescript
isAdminOrSuperAdmin(): boolean {
    return this.authService.isAdminOrSuperAdmin();
}
```

```html
<button *ngIf="isAdminOrSuperAdmin()">Admin only</button>
```

### После:
```typescript
// В constructor
constructor(public permissions: PermissionsService) {}
```

```html
<button *hasPermission="'showAdminMenu'; hasPermissionCategory: 'ui'">
    Admin only
</button>
```

## Преимущества нового подхода

1. **Централизация** - все права в одном месте (`rbac.config.ts`)
2. **Читаемость** - понятно что проверяется: `canCreateUsers` vs `isAdminOrSuperAdmin()`
3. **Гибкость** - легко добавлять новые роли и права
4. **Поддержка** - легко найти все места где используется конкретное право
5. **Безопасность** - меньше вероятность ошибки при проверке прав
6. **Тестируемость** - легко тестировать права для каждой роли

## Backend интеграция

На бэкенде уже используется RBAC фильтрация в контроллерах:

```typescript
// Пример из student.controller.ts
if (req.user?.role === 'districtRepresenter' && req.user.districtId) {
    filters.districtIds = [req.user.districtId];
} else if (req.user?.role === 'schoolDirector' && req.user.schoolId) {
    filters.schoolIds = [req.user.schoolId];
}
```

Можно использовать аналогичную конфигурацию на бэкенде для консистентности.
