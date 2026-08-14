import { Observable } from 'rxjs';
import { ToastService } from '../../shared/components/ui/toast/toast.service';

export interface StatsUpdateOptions {
    setUpdating: (isUpdating: boolean) => void;
    onSuccess: () => void;
    toastService: ToastService;
    /** Optional callback fired after each state toggle (e.g. to refresh action buttons). */
    onToggle?: () => void;
}

/**
 * Runs a stats-update service call with standard loading flag management,
 * success/error snack-bar messages, and an optional post-toggle hook.
 */
export function runStatsUpdate(
    serviceCall: Observable<unknown>,
    options: StatsUpdateOptions
): void {
    options.setUpdating(true);
    options.onToggle?.();

    serviceCall.subscribe({
        next: () => {
            options.setUpdating(false);
            options.onToggle?.();
            options.toastService.show('Statistika uğurla yeniləndi', 'success');
            options.onSuccess();
        },
        error: (err: unknown) => {
            options.setUpdating(false);
            options.onToggle?.();
            const message =
                (err as { error?: { message?: string } })?.error?.message ||
                'Xəta baş verdi';
            options.toastService.show(message, 'error');
        }
    });
}
