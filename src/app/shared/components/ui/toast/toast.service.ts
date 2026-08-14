import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'error' | 'success' | 'warning';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const DEFAULT_DURATION_MS = 5000;

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    readonly toasts = signal<Toast[]>([]);

    private nextId = 0;

    show(message: string, type: ToastType = 'info', durationMs: number = DEFAULT_DURATION_MS): void {
        const id = this.nextId++;
        this.toasts.update(list => [...list, { id, message, type }]);

        if (durationMs > 0) {
            setTimeout(() => this.dismiss(id), durationMs);
        }
    }

    dismiss(id: number): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }
}
