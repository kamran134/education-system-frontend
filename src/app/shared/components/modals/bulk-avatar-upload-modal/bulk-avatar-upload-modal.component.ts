import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../ui/modal/modal.component';
import { StudentService } from '../../../../features/students/services/student.service';
import { SnackBarService } from '../../../../features/commonComponents/services/snack-bar.service';

interface UploadResult {
    successful: string[];
    notFound: string[];
    corrupted: string[];
    total: number;
}

@Component({
    selector: 'app-bulk-avatar-upload-modal',
    imports: [CommonModule, ModalComponent],
    template: `
        <app-modal
            *ngIf="isOpen"
            [title]="'Şagirdlərin şəkillərini yüklə'"
            [size]="'lg'"
            (closed)="onCancel()">
            
            <div class="space-y-6">
                <!-- Инструкция -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-2">İnstruksiya:</h4>
                    <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Şəkil fayllarının adı şagird koduna uyğun olmalıdır (məsələn: 1234567890.jpg)</li>
                        <li>Dəstəklənən formatlar: JPG, PNG, WEBP</li>
                        <li>Maksimum fayl ölçüsü: 10MB</li>
                        <li>Bir dəfədə maksimum 500 şəkil yükləyə bilərsiniz</li>
                        <li>Şəkillər avtomatik olaraq 3:4 nisbətində kəsiləcək və sıxılacaq</li>
                    </ul>
                </div>

                <!-- Drag and Drop Zone -->
                <div
                    class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
                    [class.border-blue-500]="isDragging"
                    [class.bg-blue-50]="isDragging"
                    [class.border-gray-300]="!isDragging"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)">
                    
                    <div *ngIf="!isUploading && selectedFiles.length === 0">
                        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <p class="mt-2 text-sm text-gray-600">
                            Faylları buraya sürükləyin və ya
                            <label class="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                                seçin
                                <input 
                                    type="file" 
                                    class="hidden" 
                                    multiple 
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    (change)="onFileSelect($event)">
                            </label>
                        </p>
                    </div>

                    <div *ngIf="selectedFiles.length > 0 && !isUploading">
                        <p class="text-lg font-semibold text-gray-900">{{ selectedFiles.length }} fayl seçildi</p>
                        <button
                            type="button"
                            (click)="clearFiles()"
                            class="mt-2 text-sm text-red-600 hover:text-red-700">
                            Təmizlə
                        </button>
                    </div>

                    <div *ngIf="isUploading" class="space-y-4">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p class="text-sm text-gray-600">Yüklənir...</p>
                        <p class="text-lg font-semibold text-gray-900">{{ uploadProgress }}</p>
                    </div>
                </div>

                <!-- Результаты загрузки -->
                <div *ngIf="uploadResult" class="space-y-4">
                    <!-- Успешно загружено -->
                    <div *ngIf="uploadResult.successful.length > 0" class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-semibold text-green-900 mb-2">
                            ✓ Uğurla yükləndi: {{ uploadResult.successful.length }}
                        </h4>
                    </div>

                    <!-- Студенты не найдены -->
                    <div *ngIf="uploadResult.notFound.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-semibold text-yellow-900 mb-2">
                            Sistemdə kodları tapılmayan və şəkilləri yüklənməyən şagirdlər:
                        </h4>
                        <p class="text-sm text-yellow-800 break-words">
                            {{ uploadResult.notFound.join(', ') }}
                        </p>
                    </div>

                    <!-- Поврежденные файлы -->
                    <div *ngIf="uploadResult.corrupted.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 class="font-semibold text-red-900 mb-2">
                            Korlanmış və ya səhv formatlı fayllar:
                        </h4>
                        <p class="text-sm text-red-800 break-words">
                            {{ uploadResult.corrupted.join(', ') }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer buttons -->
            <div class="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    (click)="onCancel()"
                    [disabled]="isUploading"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ uploadResult ? 'Bağla' : 'Ləğv et' }}
                </button>
                <button
                    *ngIf="!uploadResult && selectedFiles.length > 0"
                    type="button"
                    (click)="onUpload()"
                    [disabled]="isUploading"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Yüklə
                </button>
            </div>
        </app-modal>
    `,
    styles: []
})
export class BulkAvatarUploadModalComponent {
    @Input() isOpen = false;
    @Output() closed = new EventEmitter<void>();
    @Output() uploaded = new EventEmitter<void>();

    selectedFiles: File[] = [];
    isDragging = false;
    isUploading = false;
    uploadProgress = '';
    uploadResult: UploadResult | null = null;

    private studentService = inject(StudentService);
    private snackBarService = inject(SnackBarService);

    constructor() {}

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files) {
            this.handleFiles(Array.from(files));
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.handleFiles(Array.from(input.files));
        }
    }

    private handleFiles(files: File[]): void {
        // Фильтруем только изображения
        const imageFiles = files.filter(file => 
            file.type === 'image/jpeg' || 
            file.type === 'image/jpg' || 
            file.type === 'image/png' ||
            file.type === 'image/webp'
        );

        if (imageFiles.length === 0) {
            this.snackBarService.show('Düzgün format seçilməyib', 'error');
            return;
        }

        if (imageFiles.length > 500) {
            this.snackBarService.show('Maksimum 500 fayl yükləyə bilərsiniz', 'error');
            return;
        }

        this.selectedFiles = imageFiles;
        this.uploadResult = null;
    }

    clearFiles(): void {
        this.selectedFiles = [];
        this.uploadResult = null;
    }

    async onUpload(): Promise<void> {
        if (this.selectedFiles.length === 0) return;

        this.isUploading = true;
        this.uploadProgress = `0 / ${this.selectedFiles.length} fayl emal edilir...`;

        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('avatars', file);
        });

        this.studentService.bulkUploadAvatars(formData).subscribe({
            next: (response: any) => {
                this.isUploading = false;
                this.uploadResult = response.results;
                
                const successCount = this.uploadResult?.successful.length || 0;
                const totalCount = this.uploadResult?.total || 0;
                
                this.snackBarService.show(
                    `${successCount} / ${totalCount} şəkil uğurla yükləndi`,
                    'success'
                );
                
                this.uploaded.emit();
            },
            error: (error: any) => {
                this.isUploading = false;
                console.error('Bulk upload error:', error);
                this.snackBarService.show('Yükləmə zamanı xəta baş verdi', 'error');
            }
        });
    }

    onCancel(): void {
        if (!this.isUploading) {
            this.selectedFiles = [];
            this.uploadResult = null;
            this.closed.emit();
        }
    }
}
