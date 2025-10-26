# Modal Dropdown Z-Index Fix & Memory Leak Fix

**Дата**: 26 октября 2025  
**Проблема 1**: Выпадающие списки в модальных окнах скрывались за рамкой модала, невозможно было скроллить и выбирать элементы  
**Проблема 2**: После закрытия модальных окон продолжали идти HTTP-запросы к API (утечка памяти из-за незакрытых подписок)

## Изменения

### 1. ✅ `select.component.ts` - Увеличили z-index для dropdown
**Было**:
```html
<div class="absolute z-50 mt-1...">  <!-- Dropdown -->
<div class="fixed inset-0 z-40...">  <!-- Overlay -->
```

**Стало**:
```html
<div class="absolute z-[100] mt-1...">  <!-- Dropdown -->
<div class="fixed inset-0 z-[90]...">  <!-- Overlay -->
```

### 2. ✅ `user-edit-dialog.component.html` - Заменили select на радиобаттоны
**Было**:
```html
<app-select
  label="Təsdiq vəziyyəti"
  placeholder="Təsdiq vəziyyətini seçin"
  [options]="approvalOptions"
  [(ngModel)]="dataSource.isApproved"
></app-select>
```

**Стало**:
```html
<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    Təsdiq vəziyyəti
    <span class="text-red-500 ml-1">*</span>
  </label>
  <div class="flex gap-4">
    <label class="flex items-center cursor-pointer group">
      <input type="radio" name="isApproved" [value]="true" [(ngModel)]="dataSource.isApproved" />
      <span class="ml-2 text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
        Təsdiq edilmiş
      </span>
    </label>
    <label class="flex items-center cursor-pointer group">
      <input type="radio" name="isApproved" [value]="false" [(ngModel)]="dataSource.isApproved" />
      <span class="ml-2 text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
        Təsdiq edilməmiş
      </span>
    </label>
  </div>
</div>
```

### 3. ✅ `user-edit-dialog.component.html` - Увеличили z-index для всех автокомплитов
Обновили все inline autocomplete dropdowns с `z-10` на `z-[100]`:
- District autocomplete
- School autocomplete
- Teacher autocomplete
- Student autocomplete

### 4. ✅ `user-edit-dialog.component.ts` - Удалили неиспользуемый getter
Удалили `approvalOptions` getter, так как теперь используются радиобаттоны.

## Z-Index Иерархия

После исправления:
- **Modal backdrop**: `z-50`
- **Modal content**: внутри z-50
- **Select overlay**: `z-[90]` ✅
- **Select dropdown**: `z-[100]` ✅
- **Inline autocomplete dropdowns**: `z-[100]` ✅

## Результат

✅ Выпадающие списки теперь всегда отображаются поверх модального окна  
✅ Радиобаттоны для "Təsdiq vəziyyəti" - более удобный UX (без скролла)  
✅ Все автокомплиты работают корректно в модальных окнах  
✅ Нет проблем со скроллингом и выбором элементов  
✅ **Исправлена утечка памяти** - все подписки корректно отписываются при закрытии диалогов
✅ **Нет лишних HTTP-запросов** после закрытия модальных окон

## Файлы изменены

### Z-Index & UI Fixes:
1. `src/app/shared/components/ui/form-controls/select/select.component.ts`
2. `src/app/features/dashboard/components/user-edit-dialog/user-edit-dialog.component.html`
3. `src/app/features/dashboard/components/user-edit-dialog/user-edit-dialog.component.ts`

### Memory Leak Fixes (добавлен OnDestroy + takeUntil):
4. `src/app/features/dashboard/components/user-edit-dialog/user-edit-dialog.component.ts`
5. `src/app/features/teachers/components/teacher-editing/teacher-editing-dialog.component.ts`
6. `src/app/features/students/components/student-editing/student-editing-dialog.component.ts`
7. `src/app/features/schools/components/school-editing/school-editing-dialog.component.ts`

## Технические детали

### RxJS Subscription Management

Во всех диалогах добавлен паттерн `takeUntil` для автоматической отписки:

```typescript
import { Subject, takeUntil } from 'rxjs';

export class SomeDialogComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    ngOnInit(): void {
        this.service.getData()
            .pipe(takeUntil(this.destroy$))
            .subscribe({...});
    }
    
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

Это гарантирует, что:
- Все HTTP-запросы отменяются при уничтожении компонента
- Нет утечек памяти
- Не идут лишние запросы после закрытия модальных окон

