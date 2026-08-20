import { Injectable, signal } from '@angular/core';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
}

interface ConfirmState {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: ConfirmVariant;
    resolve: (value: boolean) => void;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmDialogService {
    readonly state = signal<ConfirmState | null>(null);

    confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.state.set({
                title: options.title ?? 'Təsdiq tələb olunur',
                message: options.message,
                confirmText: options.confirmText ?? 'Bəli',
                cancelText: options.cancelText ?? 'Ləğv et',
                variant: options.variant ?? 'default',
                resolve
            });
        });
    }

    respond(value: boolean): void {
        const current = this.state();
        if (!current) return;
        this.state.set(null);
        current.resolve(value);
    }
}
