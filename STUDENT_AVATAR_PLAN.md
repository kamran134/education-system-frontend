# План реализации загрузки аватарок студентов

## Описание задачи
Добавить возможность загрузки и отображения аватарок студентов в Student Details с правами доступа для админов.

## Требования

### 1. Отображение аватара
- [ ] Если фото нет: квадратная область с иконкой человечка (placeholder)
- [ ] Если фото есть: отображение аватара студента
- [ ] Размер области аватара: определить оптимальный (например, 120x120px или 150x150px)

### 2. Права доступа
- [ ] Наведение на аватар для админа/суперадмина → показать иконку редактирования
- [ ] Только роли: admin, superadmin могут загружать фото
- [ ] Остальные роли: просто видят аватар без возможности редактирования

### 3. Загрузка и обработка
- [ ] Кнопка/клик по иконке редактирования → открыть file picker
- [ ] Формат файлов: jpeg, jpg, png
- [ ] После выбора файла → открыть modal с crop функцией
- [ ] Crop соотношение: 1:1 (квадрат)
- [ ] После кропа: сжатие до 600x600 пикселей
- [ ] Качественное сжатие (оптимизация размера файла)

### 4. Хранение
- [ ] Путь загрузки на бэкенде: `/uploads/students/avatars/`
- [ ] Формат имени файла: `{studentId}.jpg` или `{studentId}_{timestamp}.jpg`
- [ ] После успешной загрузки: обновить поле `avatar` или `avatarUrl` в модели Student

## Технический план

### Backend (Node.js/Express)

#### 1. Модель Student
- [ ] Добавить поле `avatarUrl?: string` в student.model.ts
- [ ] Migration/Update существующих записей (nullable поле)

#### 2. API Endpoint
- [ ] POST `/api/students/:id/avatar` - загрузка аватара
  - Middleware: authMiddleware + проверка роли (admin, superadmin)
  - Multer для обработки multipart/form-data
  - Валидация файла (тип, размер)
  - Сохранение в `/uploads/students/avatars/`
  - Обновление Student.avatarUrl
  - Удаление старого файла (если был)
  - Response: { success: true, avatarUrl: string }

- [ ] DELETE `/api/students/:id/avatar` - удаление аватара (опционально)
  - Удаление файла
  - Обновление Student.avatarUrl = null

- [ ] GET `/uploads/students/avatars/:filename` - отдача статических файлов
  - Настроить express.static или отдельный route

#### 3. Multer Configuration
```typescript
const storage = multer.diskStorage({
  destination: 'uploads/students/avatars/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png allowed'));
    }
  }
});
```

#### 4. Controller
- [ ] uploadStudentAvatar(req, res) - обработка загрузки
- [ ] deleteStudentAvatar(req, res) - удаление аватара

### Frontend (Angular)

#### 1. Student Model
- [ ] Добавить поле `avatarUrl?: string` в student.model.ts

#### 2. Student Details Component

**HTML:**
- [ ] Секция с аватаром вверху страницы (слева от основной информации или в header)
- [ ] Структура:
  ```html
  <div class="avatar-container" (mouseenter)="onAvatarHover(true)" (mouseleave)="onAvatarHover(false)">
    <img *ngIf="student.avatarUrl" [src]="getAvatarUrl()" />
    <div *ngIf="!student.avatarUrl" class="avatar-placeholder">
      <lucide-icon [img]="UserIcon" />
    </div>
    
    <div *ngIf="isAvatarHovered && canEditAvatar" class="edit-overlay" (click)="openAvatarUpload()">
      <lucide-icon [img]="EditIcon" />
    </div>
  </div>
  
  <input #fileInput type="file" accept="image/jpeg,image/jpg,image/png" 
         (change)="onFileSelected($event)" style="display: none" />
  ```

**TypeScript:**
- [ ] `isAvatarHovered = false`
- [ ] `canEditAvatar` getter - проверка роли (admin/superadmin)
- [ ] `onAvatarHover(state: boolean)` - управление hover state
- [ ] `openAvatarUpload()` - trigger file input click
- [ ] `onFileSelected(event)` - обработка выбранного файла → открыть crop modal
- [ ] `getAvatarUrl()` - формирование полного URL аватара

#### 3. Image Crop Modal Component

**Библиотека для кропа:**
- [ ] Установить: `ngx-image-cropper` или `angular-cropperjs`
- [ ] Пример: `npm install ngx-image-cropper`

**Функционал:**
- [ ] Открытие модала с выбранным изображением
- [ ] Crop в соотношении 1:1
- [ ] Кнопки: "Отмена", "Сохранить"
- [ ] После кропа: resize до 600x600
- [ ] Конвертация в blob/file
- [ ] Отправка на backend

**HTML:**
```html
<app-modal [isOpen]="isCropModalOpen" (close)="closeCropModal()">
  <h2>Şəkli kəs</h2>
  <image-cropper
    [imageChangedEvent]="imageChangedEvent"
    [maintainAspectRatio]="true"
    [aspectRatio]="1"
    format="jpeg"
    [outputType]="'blob'"
    (imageCropped)="imageCropped($event)">
  </image-cropper>
  
  <div class="buttons">
    <button (click)="closeCropModal()">Ləğv et</button>
    <button (click)="uploadAvatar()">Yüklə</button>
  </div>
</app-modal>
```

**TypeScript:**
```typescript
isCropModalOpen = false;
imageChangedEvent: any;
croppedImage: Blob | null = null;

onFileSelected(event: any): void {
  this.imageChangedEvent = event;
  this.isCropModalOpen = true;
}

imageCropped(event: ImageCroppedEvent): void {
  this.croppedImage = event.blob;
}

async uploadAvatar(): Promise<void> {
  if (!this.croppedImage) return;
  
  const formData = new FormData();
  formData.append('avatar', this.croppedImage, 'avatar.jpg');
  
  this.studentService.uploadAvatar(this.student._id, formData).subscribe({
    next: (response) => {
      this.student.avatarUrl = response.avatarUrl;
      this.isCropModalOpen = false;
      // Toast success
    },
    error: (error) => {
      // Toast error
    }
  });
}
```

#### 4. Student Service
- [ ] Добавить метод `uploadAvatar(studentId: string, formData: FormData): Observable<any>`
  ```typescript
  uploadAvatar(studentId: string, formData: FormData): Observable<any> {
    return this.http.post(`${API_URL}/students/${studentId}/avatar`, formData);
  }
  ```

#### 5. Стилизация (SCSS)
```scss
.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #9ca3af;
    
    lucide-icon {
      width: 60px;
      height: 60px;
    }
  }
  
  .edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    lucide-icon {
      width: 32px;
      height: 32px;
    }
  }
}
```

## Вопросы для уточнения

1. **Где именно на странице Student Details разместить аватар?**
   - В header страницы слева от имени?
   - В отдельной секции сверху?
   - В карточке с основной информацией?

2. **Максимальный размер файла для загрузки?**
   - 5MB? 10MB?

3. **Нужна ли возможность удалить аватар?**
   - Кнопка "Удалить фото" в hover overlay?
   - Или только замена?

4. **Формат хранения имени файла?**
   - `{studentId}.jpg` (перезапись при новой загрузке)
   - `{studentId}_{timestamp}.jpg` (новый файл каждый раз, удаление старого)

5. **Показывать ли аватары в других местах?**
   - В таблице студентов (список)?
   - В рейтингах?
   - Только в Student Details?

6. **Использовать существующий Modal компонент или создать новый для кропа?**

7. **Качество JPEG после сжатия?**
   - 0.8 (80%)? 0.9 (90%)?

## Порядок выполнения

### Этап 1: Backend
1. Обновить Student модель
2. Создать папку uploads/students/avatars/
3. Настроить multer
4. Создать controller методы
5. Добавить routes
6. Протестировать через Postman

### Этап 2: Frontend базовая функциональность
1. Обновить Student модель
2. Добавить секцию аватара в student-details.component
3. Реализовать hover эффект с edit overlay
4. Добавить проверку прав доступа

### Этап 3: Image Cropper
1. Установить библиотеку ngx-image-cropper
2. Создать crop modal компонент
3. Интегрировать в student-details
4. Настроить resize до 600x600
5. Настроить качество сжатия

### Этап 4: Интеграция и тестирование
1. Подключить service метод
2. Обработка успеха/ошибок
3. Toast уведомления
4. Тестирование всего flow
5. Проверка прав доступа

### Этап 5: Опционально
1. Отображение аватаров в списке студентов
2. Оптимизация загрузки (lazy loading)
3. Placeholder с инициалами вместо иконки
