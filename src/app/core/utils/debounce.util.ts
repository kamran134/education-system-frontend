import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * Subscribes to a Subject with debounce + distinctUntilChanged.
 * Use for search/filter inputs where repeated identical values should be ignored.
 */
export function connectSearchDebounce(
    source$: Subject<string>,
    handler: (value: string) => void,
    destroy$: Observable<void>,
    ms = 300
): void {
    source$.pipe(
        debounceTime(ms),
        distinctUntilChanged(),
        takeUntil(destroy$)
    ).subscribe(handler);
}

/**
 * Subscribes to a Subject with debounce only (no distinctUntilChanged).
 * Use when every emission should trigger the handler, even if the value is the same.
 */
export function connectDebounce<T>(
    source$: Subject<T>,
    handler: (value: T) => void,
    destroy$: Observable<void>,
    ms = 300
): void {
    source$.pipe(
        debounceTime(ms),
        takeUntil(destroy$)
    ).subscribe(handler);
}
