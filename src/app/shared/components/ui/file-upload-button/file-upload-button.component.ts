import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, FileText, X } from 'lucide-angular';

export interface FileUploadConfig {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

@Component({
  selector: 'app-file-upload-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-2">
      <!-- File Input (hidden) -->
      <input
        #fileInput
        type="file"
        [accept]="config.accept || '*'"
        [multiple]="config.multiple || false"
        (change)="onFileSelect($event)"
        class="hidden"
      />

      <!-- Upload Button -->
      <button
        type="button"
        [disabled]="disabled || uploading"
        (click)="triggerFileSelect()"
        [class]="buttonClasses"
      >
        <lucide-icon 
          [img]="uploading ? FileText : Upload" 
          class="h-4 w-4"
          [class.animate-pulse]="uploading"
        ></lucide-icon>
        <span>{{ uploading ? uploadingText : buttonText }}</span>
      </button>

      <!-- Selected Files Display -->
      <div *ngIf="selectedFiles.length > 0" class="space-y-1">
        <div *ngFor="let file of selectedFiles; trackBy: trackByName"
             class="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
          <div class="flex items-center space-x-2 min-w-0 flex-1">
            <lucide-icon [img]="FileText" class="h-4 w-4 text-gray-400 flex-shrink-0"></lucide-icon>
            <span class="truncate text-gray-700">{{ file.name }}</span>
            <span class="text-xs text-gray-500 flex-shrink-0">({{ formatFileSize(file.size) }})</span>
          </div>
          
          <button
            type="button"
            (click)="removeFile(file)"
            class="ml-2 text-gray-400 hover:text-red-500 transition-colors"
            [disabled]="uploading"
          >
            <lucide-icon [img]="X" class="h-3 w-3"></lucide-icon>
          </button>
        </div>

        <!-- Upload Action Button -->
        <div *ngIf="selectedFiles.length > 0 && !autoUpload" class="flex justify-end">
          <button
            type="button"
            (click)="uploadFiles()"
            [disabled]="uploading"
            class="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{{ uploading ? 'Yüklənir...' : 'Yüklə' }}</span>
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div *ngIf="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
        {{ error }}
      </div>

      <!-- Help Text -->
      <div *ngIf="helpText && !error" class="text-xs text-gray-500">
        {{ helpText }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FileUploadButtonComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() buttonText: string = 'Fayldan əlavə et';
  @Input() uploadingText: string = 'Yüklənir...';
  @Input() config: FileUploadConfig = {};
  @Input() disabled: boolean = false;
  @Input() autoUpload: boolean = true; // Auto upload when files selected
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'secondary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() helpText: string = '';

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadStart = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<{files: File[], results?: any}>();
  @Output() uploadError = new EventEmitter<{files: File[], error: any}>();

  // Icons
  readonly Upload = Upload;
  readonly FileText = FileText;
  readonly X = X;

  // State
  selectedFiles: File[] = [];
  uploading = false;
  error: string = '';

  get buttonClasses(): string {
    const baseClasses = [
      'inline-flex items-center space-x-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ];

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    baseClasses.push(sizeClasses[this.size]);

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
    };
    baseClasses.push(variantClasses[this.variant]);

    return baseClasses.join(' ');
  }

  triggerFileSelect(): void {
    if (this.disabled || this.uploading) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.error = '';

    // Validate files
    const validFiles = this.validateFiles(files);
    if (validFiles.length === 0) return;

    this.selectedFiles = this.config.multiple ? [...this.selectedFiles, ...validFiles] : validFiles;
    this.filesSelected.emit([...this.selectedFiles]);

    if (this.autoUpload) {
      this.uploadFiles();
    }

    // Clear input
    input.value = '';
  }

  removeFile(fileToRemove: File): void {
    this.selectedFiles = this.selectedFiles.filter(file => file !== fileToRemove);
    this.error = '';
  }

  uploadFiles(): void {
    if (this.selectedFiles.length === 0 || this.uploading) return;

    this.uploading = true;
    this.error = '';
    
    this.uploadStart.emit([...this.selectedFiles]);

    // Simulate upload process - in real app, this would be a service call
    setTimeout(() => {
      try {
        // Here you would typically call a service to upload files
        this.uploadComplete.emit({
          files: [...this.selectedFiles],
          results: { success: true, message: 'Fayllar uğurla yükləndi' }
        });
        
        this.selectedFiles = [];
        this.uploading = false;
      } catch (error) {
        this.uploadError.emit({
          files: [...this.selectedFiles],
          error
        });
        this.error = 'Fayl yüklənməsində xəta baş verdi';
        this.uploading = false;
      }
    }, 1500);
  }

  private validateFiles(files: File[]): File[] {
    const validFiles: File[] = [];

    for (const file of files) {
      // Check file size
      if (this.config.maxSize && file.size > this.config.maxSize) {
        this.error = `Fayl ölçüsü ${this.formatFileSize(this.config.maxSize)} maksimum ölçüsündən böyükdür`;
        continue;
      }

      // Check file type if accept pattern is specified
      if (this.config.accept && this.config.accept !== '*') {
        const acceptedTypes = this.config.accept.split(',').map(t => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;

        const isValidType = acceptedTypes.some(acceptedType => {
          if (acceptedType.startsWith('.')) {
            return fileExtension === acceptedType.toLowerCase();
          }
          if (acceptedType.includes('/*')) {
            return mimeType.startsWith(acceptedType.replace('/*', ''));
          }
          return mimeType === acceptedType;
        });

        if (!isValidType) {
          this.error = `Fayl növü dəstəklənmir. İcazə verilən növlər: ${this.config.accept}`;
          continue;
        }
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByName(index: number, file: File): string {
    return file.name;
  }

  // Public methods for external control
  clearFiles(): void {
    this.selectedFiles = [];
    this.error = '';
  }

  setError(error: string): void {
    this.error = error;
    this.uploading = false;
  }

  setUploading(uploading: boolean): void {
    this.uploading = uploading;
  }
}