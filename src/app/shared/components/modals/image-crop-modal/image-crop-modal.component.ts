import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from 'ngx-image-cropper';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
    selector: 'app-image-crop-modal',
    imports: [ImageCropperComponent, ModalComponent],
    template: `
    @if (isOpen) {
      <app-modal
        [title]="'Şəkli kəs'"
        [size]="'lg'"
        (closed)="onCancel()">
        <div class="crop-container mb-6">
          <image-cropper
            [imageChangedEvent]="imageChangedEvent"
            [maintainAspectRatio]="true"
            [aspectRatio]="aspectRatio"
            [resizeToWidth]="resizeToWidth"
            [cropperMinWidth]="100"
            format="jpeg"
            [imageQuality]="80"
            (imageCropped)="imageCropped($event)"
            (imageLoaded)="imageLoaded($event)"
            (cropperReady)="cropperReady()"
            (loadImageFailed)="loadImageFailed()">
          </image-cropper>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            Ləğv et
          </button>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="!croppedImage"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
            Yüklə
          </button>
        </div>
      </app-modal>
    }
    `,
    styles: [`
    .crop-container {
      max-height: 500px;
      overflow: hidden;
    }
  `]
})
export class ImageCropModalComponent {
  @Input() isOpen = false;
  @Input() imageChangedEvent: any;
  @Input() aspectRatio = 3 / 4;
  @Input() resizeToWidth = 600;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Blob>();

  croppedImage: Blob | null = null;

  imageCropped(event: ImageCroppedEvent): void {
    if (event.blob) {
      this.croppedImage = event.blob;
    }
  }

  imageLoaded(image: LoadedImage): void {
    console.log('Image loaded successfully');
  }

  cropperReady(): void {
    console.log('Cropper ready');
  }

  loadImageFailed(): void {
    console.error('Load image failed');
  }

  onCancel(): void {
    this.croppedImage = null;
    this.close.emit();
  }

  onSave(): void {
    if (this.croppedImage) {
      this.save.emit(this.croppedImage);
    }
  }
}
