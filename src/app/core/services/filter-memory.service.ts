import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router, UrlTree } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService } from '../../shared/components/ui/toast/toast.service';

const STORAGE_PREFIX = 'filters:';

/** Drops every remembered filter of this browser tab — called on logout, so the next user of
 *  the same tab does not inherit someone else's district/school/teacher ids. */
export function clearRememberedFilters(): void {
    try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
        }
    } catch {
        // storage unavailable (private mode, blocked site data) — nothing to clear
    }
}

/**
 * Filter memory per page, per browser tab (customer request 30.10.2026).
 *
 * The list pages keep their filters/sort/page in the URL query string (syncStateToUrl /
 * syncFiltersToUrl in each component). This service remembers the last query string of every
 * page guarded by `restoreFiltersGuard` in sessionStorage, keyed by the path (`/students`,
 * `/teachers/12/students`, ...), and the guard puts it back when the page is opened again
 * without it — from the menu, a «Geri» button or browser history. sessionStorage lives exactly
 * as long as the tab: closing the tab and opening the link anew starts clean, F5 keeps it.
 *
 * Explicit links win: a URL whose own query params are NOT all part of the remembered state
 * (e.g. a profile link to /exam-results?districtIds=5 when the last state was another district)
 * is opened as is and becomes the new remembered state.
 */
@Injectable({
    providedIn: 'root'
})
export class FilterMemoryService {
    private router = inject(Router);
    private location = inject(Location);
    private toastService = inject(ToastService);

    /** Paths that went through the guard — only those are recorded. */
    private readonly tracked = new Set<string>();
    /** Path restored by the guard, until its page asks via takeRestored(). */
    private restoredPath: string | null = null;
    private toastPending = false;

    constructor() {
        // onUrlChange covers router navigations, popstate and the bare Location.replaceState
        // that /stats uses to rewrite its URL without a navigation. The new URL is already in
        // place when listeners run; path() reads it without the base href.
        this.location.onUrlChange(() => this.record(this.location.path()));

        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
            if (!this.toastPending) return;
            this.toastPending = false;
            this.toastService.show('Bu səhifədə son seçdiyiniz filtrlər bərpa olundu', 'info', 3000);
        });
    }

    /** Guard entry point: `true` to open the URL as is, or a UrlTree with the remembered state. */
    restore(url: string): true | UrlTree {
        const tree = this.router.parseUrl(url);
        const path = this.pathOf(tree);
        this.tracked.add(path);

        const saved = this.read(path);
        if (!saved) return true;
        const savedTree = this.router.parseUrl(`${path}?${saved}`);

        const current = tree.queryParams;
        const remembered = savedTree.queryParams;
        const currentKeys = Object.keys(current);
        const isPartOfRemembered = currentKeys.every(k => String(remembered[k]) === String(current[k]));
        if (!isPartOfRemembered || currentKeys.length === Object.keys(remembered).length) return true;

        this.restoredPath = path;
        this.toastPending = true;
        return savedTree;
    }

    /** true once if the current page was opened with remembered filters — pages use it to expand
     *  a collapsed filter panel, so the restored selection is visible, not just applied. */
    takeRestored(): boolean {
        const path = this.pathOf(this.router.parseUrl(this.router.url));
        if (this.restoredPath !== path) return false;
        this.restoredPath = null;
        return true;
    }

    private record(url: string): void {
        const tree = this.router.parseUrl(url);
        const path = this.pathOf(tree);
        if (!this.tracked.has(path)) return;
        const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
        try {
            sessionStorage.setItem(STORAGE_PREFIX + path, query);
        } catch {
            // storage unavailable — the page simply won't be remembered
        }
    }

    private read(path: string): string | null {
        try {
            return sessionStorage.getItem(STORAGE_PREFIX + path);
        } catch {
            return null;
        }
    }

    private pathOf(tree: UrlTree): string {
        const segments = tree.root.children['primary']?.segments ?? [];
        return '/' + segments.map(s => s.path).join('/');
    }
}
