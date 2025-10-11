# Unified Dialog System

Система унифицированных модальных окон для образовательной системы.

## Особенности

- 🎨 Современный дизайн с Tailwind CSS
- 🔧 Полностью настраиваемые диалоги
- 📱 Адаптивный дизайн
- ⚡ Легкие анимации и переходы
- 🎭 Различные типы диалогов (info, success, warning, error, confirm)
- 🔄 Поддержка loading состояний
- 🎯 Type-safe с полной поддержкой TypeScript
- 🌐 Локализация на азербайджанском языке

## Установка

1. Импортируйте `DialogService` в ваш компонент:

```typescript
import { DialogService } from './shared/components/ui/dialog';

constructor(private dialogService: DialogService) {}
```

2. Добавьте контейнер диалогов в `app.component.html`:

```html
<div #dialogContainer></div>
```

3. Настройте контейнер в `app.component.ts`:

```typescript
@ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;

ngAfterViewInit(): void {
    this.dialogService.setContainer(this.dialogContainer);
}
```

## Базовое использование

### Простые диалоги

```typescript
// Информационный диалог
this.dialogService.alert({
    title: 'Məlumat',
    content: 'Bu məlumat dialoqxanasıdır.',
    type: 'info'
});

// Диалог успеха
this.dialogService.success({
    title: 'Uğur',
    content: 'Əməliyyat uğurla icra edildi!'
});

// Предупреждение
this.dialogService.warning({
    title: 'Diqqət',
    content: 'Bu əməliyyat geri qaytarıla bilməz.'
});

// Ошибка
this.dialogService.error({
    title: 'Xəta',
    content: 'Əməliyyat zamanı xəta baş verdi.'
});
```

### Диалоги подтверждения

```typescript
const dialogRef = this.dialogService.confirm({
    title: 'Təsdiq tələb olunur',
    content: 'Davam etmək istədiyinizdən əminsiniz mi?',
    confirmText: 'Bəli',
    cancelText: 'Xeyr'
});

dialogRef.confirmed$.subscribe(() => {
    // Пользователь подтвердил действие
    console.log('Confirmed');
});

dialogRef.cancelled$.subscribe(() => {
    // Пользователь отменил действие
    console.log('Cancelled');
});
```

### Диалог удаления

```typescript
const dialogRef = this.dialogService.confirm({
    title: 'Silinməyə razılıq',
    content: 'Bu elementi silmək istədiyinizdən əminsiniz mi?',
    type: 'error',
    confirmText: 'Sil',
    cancelText: 'Ləğv et'
});
```

## Расширенное использование

### Кастомный диалог с несколькими кнопками

```typescript
const dialogRef = this.dialogService.open({
    title: 'Xüsusi dialoq',
    content: 'Xüsusi məzmun və düymələr.',
    size: 'lg',
    actions: [
        {
            label: 'Ləğv et',
            action: () => dialogRef.close(),
            variant: 'secondary'
        },
        {
            label: 'Saxla',
            action: () => this.save(),
            variant: 'primary'
        },
        {
            label: 'Sil',
            action: () => this.delete(),
            variant: 'danger'
        }
    ]
});
```

### Диалог с загрузкой

```typescript
let loading = false;

const dialogRef = this.dialogService.open({
    title: 'Yükləmə nümunəsi',
    content: 'Məlumatlar yüklənir...',
    actions: [
        {
            label: 'Saxla',
            action: () => {
                loading = true;
                // Simulate async operation
                setTimeout(() => {
                    loading = false;
                    dialogRef.close();
                }, 2000);
            },
            variant: 'primary',
            loading: loading
        }
    ]
});
```

### Использование с компонентами

```typescript
// В компоненте школ
openSchoolDialog(school?: School): void {
    const dialogRef = this.dialogService.open({
        title: school ? 'Məktəbi redaktə et' : 'Yeni məktəb',
        size: 'lg',
        showFooter: false // Используем кастомные кнопки в компоненте
    });

    // Вставить компонент школы в диалог программно
    // (требует дополнительной настройки)
}
```

## Настройки диалога

### Размеры

```typescript
size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
```

### Типы

```typescript
type: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'custom'
```

### Варианты кнопок

```typescript
variant: 'primary' | 'secondary' | 'danger' | 'success'
```

## Полная конфигурация

```typescript
interface DialogConfig {
    title?: string;
    content?: string;
    type?: DialogType;
    size?: DialogSize;
    icon?: any; // Lucide icon
    
    showHeader?: boolean;
    showFooter?: boolean;
    showCloseButton?: boolean;
    showCancelButton?: boolean;
    showConfirmButton?: boolean;
    closeOnOverlayClick?: boolean;
    
    cancelText?: string;
    confirmText?: string;
    confirmDisabled?: boolean;
    confirmLoading?: boolean;
    
    actions?: DialogAction[];
}
```

## События диалога

```typescript
const dialogRef = this.dialogService.open(config);

// Диалог закрыт
dialogRef.closed$.subscribe(() => {
    console.log('Dialog closed');
});

// Пользователь подтвердил
dialogRef.confirmed$.subscribe(() => {
    console.log('Dialog confirmed');
});

// Пользователь отменил
dialogRef.cancelled$.subscribe(() => {
    console.log('Dialog cancelled');
});
```

## Методы управления

```typescript
// Закрыть диалог
dialogRef.close();

// Программно подтвердить
dialogRef.confirm();

// Программно отменить
dialogRef.cancel();

// Обновить конфигурацию
dialogRef.updateConfig({ title: 'Yeni başlıq' });

// Закрыть все диалоги
this.dialogService.closeAll();
```

## Демонстрация

Посетите `/demo/dialogs` для интерактивной демонстрации всех возможностей системы диалогов.

## Миграция с Material Dialog

### Старый код:
```typescript
const dialogRef = this.dialog.open(Component, {
    width: '500px',
    data: { someData: 'value' }
});

dialogRef.afterClosed().subscribe(result => {
    if (result) {
        // Handle result
    }
});
```

### Новый код:
```typescript
const dialogRef = this.dialogService.open({
    title: 'Заголовок',
    size: 'md',
    actions: [
        {
            label: 'Сохранить',
            action: () => {
                // Handle save
                dialogRef.close();
            },
            variant: 'primary'
        }
    ]
});
```