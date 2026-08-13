import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';

import { LucideAngularModule, X } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface ModalButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  action: () => void;
}

@Component({
    selector: 'app-modal',
    imports: [LucideAngularModule, ButtonComponent],
    template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
      [@fadeInOut]
      (click)="onBackdropClick()"
      >
      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <!-- Modal Content -->
        <div
          [class]="modalClasses"
          [@slideInOut]
          (click)="$event.stopPropagation()"
          role="dialog"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="contentId"
          >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-4">
            <div class="flex-1">
              <h3 [id]="titleId" class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
              @if (subtitle) {
                <p class="mt-1 text-sm text-gray-600">
                  {{ subtitle }}
                </p>
              }
            </div>
            @if (showCloseButton) {
              <button
                type="button"
                class="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                (click)="onClose()"
                >
                <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
              </button>
            }
          </div>
    
          <!-- Content -->
          <div [id]="contentId" class="py-4 max-h-[60vh] overflow-y-auto">
            <ng-content></ng-content>
          </div>
    
          <!-- Footer -->
          @if (buttons && buttons.length > 0) {
            <div class="flex justify-end space-x-3 border-t border-gray-200 pt-4">
              @for (button of buttons; track button) {
                <app-button
                  [variant]="button.variant || 'outline'"
                  [disabled]="button.disabled || false"
                  (clicked)="button.action()"
                  >
                  @if (button.loading) {
                    <div class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>{{ button.label }}</span>
                    </div>
                  }
                  @if (!button.loading) {
                    <span>{{ button.label }}</span>
                  }
                </app-button>
              }
            </div>
          }
        </div>
      </div>
    </div>
    `,
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('150ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('slideInOut', [
            transition(':enter', [
                style({ transform: 'scale(0.9)', opacity: 0 }),
                animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 }))
            ])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnInit {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() showCloseButton = true;
  @Input() closeOnBackdropClick = true;
  @Input() buttons: ModalButton[] = [];

  @Output() closed = new EventEmitter<void>();

  readonly X = X;
  titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  contentId = `modal-content-${Math.random().toString(36).substr(2, 9)}`;

  ngOnInit(): void {
    // Предотвращаем прокрутку страницы когда модалка открыта
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    // Восстанавливаем прокрутку
    document.body.style.overflow = '';
  }

  get modalClasses(): string {
    const baseClasses = 'relative w-full bg-white rounded-lg shadow-xl transform transition-all';

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    };

    return `${baseClasses} ${sizeClasses[this.size]} p-6`;
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.onClose();
    }
  }

  onClose(): void {
    document.body.style.overflow = '';
    this.closed.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    this.onClose();
  }
}
