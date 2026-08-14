import { Component, inject } from '@angular/core';
import { LucideAngularModule, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-angular';
import { ToastService, ToastType } from './toast.service';

const ICONS: Record<ToastType, any> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
};

const STYLES: Record<ToastType, string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-600 text-white'
};

@Component({
    selector: 'app-toast-container',
    imports: [LucideAngularModule],
    template: `
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-md rounded-lg px-4 py-3 shadow-lg"
          [class]="styleFor(toast.type)"
          role="status"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
          >
          <lucide-icon [img]="iconFor(toast.type)" class="h-5 w-5 shrink-0"></lucide-icon>
          <span class="text-sm flex-1 whitespace-pre-line">{{ toast.message }}</span>
          <button
            type="button"
            class="shrink-0 opacity-80 hover:opacity-100"
            (click)="toastService.dismiss(toast.id)"
            >
            <lucide-icon [img]="X" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
      }
    </div>
    `
})
export class ToastContainerComponent {
    readonly toastService = inject(ToastService);
    readonly X = X;

    iconFor(type: ToastType): any {
        return ICONS[type];
    }

    styleFor(type: ToastType): string {
        return STYLES[type];
    }
}
