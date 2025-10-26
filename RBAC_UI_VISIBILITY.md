# RBAC UI Visibility Implementation

## Обзор изменений

Расширена система RBAC для управления видимостью секций на главной странице и вкладок в рейтингах в зависимости от роли пользователя.

## 1. Обновление RBAC конфигурации (`rbac.config.ts`)

### Добавлены новые UI permissions:

```typescript
ui: {
    // Существующие разрешения
    showAdminMenu: boolean;
    showUserManagementLink: boolean;
    showRatingColumnsLink: boolean;
    showStatsUpdateButton: boolean;
    showExportButtons: boolean;
    showBulkActions: boolean;
    
    // Новые разрешения для главной страницы
    showDistrictsSection: boolean;
    showSchoolsSection: boolean;
    showTeachersSection: boolean;
    showStudentsSection: boolean;
    showExamsSection: boolean;
    showStatsSection: boolean;
    
    // Новые разрешения для вкладок рейтингов
    showDistrictsTab: boolean;
    showSchoolsTab: boolean;
    showTeachersTab: boolean;
    showStudentsTab: boolean;
}
```

## 2. Правила видимости по ролям

### Superadmin / Admin
- ✅ Видят ВСЕ секции на главной странице
- ✅ Видят ВСЕ вкладки в рейтингах

### Представитель района (districtRepresenter)
- ❌ **НЕ видит** секции "Районы" и "Экзамены"
- ✅ Видит секции: Школы, Учителя, Студенты, Рейтинг
- ✅ Видит вкладку "Районы" (но показывает только свой район - фильтруется на backend)
- ✅ Видит все остальные вкладки в рейтингах

### Директор школы (schoolDirector)
- ❌ **НЕ видит** секции "Районы", "Школы" и "Экзамены"
- ✅ Видит секции: Учителя, Студенты, Рейтинг
- ❌ **НЕ видит** вкладку "Районы" в рейтингах
- ✅ Видит вкладку "Школы" (но показывает только свою школу - фильтруется на backend)
- ✅ Видит вкладки: Учителя, Студенты

### Учитель (teacher)
- ❌ **НЕ видит** секции "Районы", "Школы", "Учителя" и "Экзамены"
- ✅ Видит секции: Студенты, Рейтинг
- ❌ **НЕ видит** вкладки "Районы" и "Школы" в рейтингах
- ✅ Видит вкладку "Учителя" (но показывает только себя - фильтруется на backend)
- ✅ Видит вкладку "Студенты"

### Студент (student)
- ❌ **НЕ видит** секции "Районы", "Школы", "Учителя" и "Экзамены"
- ✅ Видит секции: Студенты, Рейтинг
- ❌ **НЕ видит** вкладки "Районы", "Школы" и "Учителя" в рейтингах
- ✅ Видит вкладку "Студенты" (но показывает только себя - фильтруется на backend)

## 3. Изменения в компонентах

### HomeComponent (`home.component.ts` и `home.component.html`)

**Изменения в TypeScript:**
```typescript
constructor(public permissions: PermissionsService) {}
```

**Изменения в HTML:**
Каждая карточка теперь использует директиву `*ngIf` с проверкой прав доступа:

```html
<!-- Districts Card -->
<div *ngIf="permissions.canShowUI('showDistrictsSection')" ...>

<!-- Schools Card -->
<div *ngIf="permissions.canShowUI('showSchoolsSection')" ...>

<!-- Teachers Card -->
<div *ngIf="permissions.canShowUI('showTeachersSection')" ...>

<!-- Students Card -->
<div *ngIf="permissions.canShowUI('showStudentsSection')" ...>

<!-- Exams Card -->
<div *ngIf="permissions.canShowUI('showExamsSection')" ...>

<!-- Stats Card -->
<div *ngIf="permissions.canShowUI('showStatsSection')" ...>
```

### StatsComponent (`stats.component.ts`)

**Добавлен импорт:**
```typescript
import { PermissionsService } from '../../../../core/services/permissions.service';
```

**Обновлен конструктор:**
```typescript
constructor(
    // ... other services
    public permissions: PermissionsService
) { }
```

**Изменена логика фильтрации вкладок:**
```typescript
// Все возможные табы с привязкой к разрешениям
private allTabs = [
    { label: 'İnkişaf edən şagirdlər', key: 'developingStudents', permission: 'showStudentsTab' },
    { label: 'Ayın şagirdləri', key: 'studentsOfMonth', permission: 'showStudentsTab' },
    { label: 'Respublika üzrə ayın şagirdləri', key: 'studentsOfMonthByRepublic', permission: 'showStudentsTab' },
    { label: 'İlin şagirdləri', key: 'allStudents', permission: 'showStudentsTab' },
    { label: 'İlin müəllimləri', key: 'allTeachers', permission: 'showTeachersTab' },
    { label: 'İlin məktəbləri', key: 'allSchools', permission: 'showSchoolsTab' },
    { label: 'İlin rayonları / şəhərləri', key: 'allDistricts', permission: 'showDistrictsTab' }
];

// Геттер для динамической фильтрации вкладок
get tabs() {
    return this.allTabs.filter(tab => 
        this.permissions.canShowUI(tab.permission as any)
    );
}
```

## 4. Backend фильтрация данных

⚠️ **Важно:** Скрытие UI элементов - это только первый уровень защиты. Backend уже фильтрует данные на уровне контроллеров:

- **Районный представитель** видит только свой район (фильтр по `districtId`)
- **Директор школы** видит только свою школу (фильтр по `schoolId`)
- **Учитель** видит только себя и своих студентов (фильтр по `teacherId`)
- **Студент** видит только себя (фильтр по `studentId`)

Эти фильтры реализованы в:
- `stat.controller.ts` - для статистики
- `student.controller.ts` - для студентов
- `teacher.controller.ts` - для учителей
- `school.controller.ts` - для школ
- `district.controller.ts` - для районов

## 5. Как работает система

1. **Пользователь заходит на сайт** → AuthService определяет роль
2. **PermissionsService** загружает права доступа для этой роли из `rbac.config.ts`
3. **HomeComponent** проверяет `permissions.canShowUI('showDistrictsSection')` для каждой секции
4. **StatsComponent** фильтрует массив `tabs` через геттер, оставляя только разрешенные вкладки
5. **Backend** дополнительно фильтрует данные в контроллерах на основе роли пользователя

## 6. Преимущества новой системы

- ✅ **Централизованная конфигурация** - все права в одном месте (`rbac.config.ts`)
- ✅ **Type-safe** - TypeScript проверяет правильность ключей разрешений
- ✅ **Декларативный подход** - использование `*ngIf` в шаблонах
- ✅ **Легко расширяется** - добавление нового разрешения требует минимальных изменений
- ✅ **Backend + Frontend** - двойная защита данных
- ✅ **Нет дублирования кода** - логика проверки прав в одном сервисе

## 7. Тестирование

Для проверки системы:

1. Войдите под разными ролями (superadmin, admin, districtRepresenter, schoolDirector, teacher, student)
2. Проверьте главную страницу - должны быть видны только разрешенные секции
3. Перейдите в Рейтинг - должны быть видны только разрешенные вкладки
4. Убедитесь, что данные фильтруются корректно (например, районный представитель видит только свой район)

## 8. Будущие улучшения

- [ ] Мигрировать остальные компоненты на RBAC систему
- [ ] Добавить RBAC для кнопок действий (создать, редактировать, удалить)
- [ ] Добавить audit log для отслеживания действий пользователей
- [ ] Создать UI для управления ролями и правами (для superadmin)
