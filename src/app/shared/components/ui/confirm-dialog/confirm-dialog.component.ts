import { Component, HostListener, inject } from '@angular/core';
import { LucideAngularModule, AlertTriangle, HelpCircle } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
    selector: 'app-confirm-dialog',
    imports: [LucideAngularModule],
    template: `
    @if (dialog.state(); as state) {
      <div
        class="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
        [@fadeInOut]
        (click)="dialog.respond(false)"
        >
        <div
          class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
          [@slideInOut]
          (click)="$event.stopPropagation()"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="state.title"
          >
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              [class]="state.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'"
              >
              <lucide-icon [img]="state.variant === 'danger' ? AlertTriangle : HelpCircle" class="h-5 w-5"></lucide-icon>
            </div>
            <div class="flex-1 pt-1">
              <h3 class="text-base font-semibold text-gray-900">{{ state.title }}</h3>
              <p class="mt-1 whitespace-pre-line text-sm text-gray-600">{{ state.message }}</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              (click)="dialog.respond(false)"
              >
              {{ state.cancelText }}
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              [class]="state.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'"
              (click)="dialog.respond(true)"
              >
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
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
                style({ transform: 'scale(0.95)', opacity: 0 }),
                animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
            ])
        ])
    ]
})
export class ConfirmDialogComponent {
    readonly dialog = inject(ConfirmDialogService);
    readonly AlertTriangle = AlertTriangle;
    readonly HelpCircle = HelpCircle;

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        this.dialog.respond(false);
    }
}
