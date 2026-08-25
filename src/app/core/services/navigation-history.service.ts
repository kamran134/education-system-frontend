import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';

/**
 * «Geri» на профилях должен возвращать туда, откуда пришли, а не всегда на /panel
 * (BASE_FIXES_TASK.md §1.5). Считаем переходы САМОГО SPA-роутера с момента запуска
 * приложения — не `window.history.length`: та величина включает и страницы до захода
 * в приложение (внешние сайты, предыдущую вкладку и т.п.), и `location.back()` по ней
 * может увести пользователя из приложения целиком.
 */
@Injectable({
    providedIn: 'root'
})
export class NavigationHistoryService {
    private navigationCount = 0;

    constructor(private router: Router, private location: Location) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) this.navigationCount++;
        });
    }

    /** true, если внутри этой сессии SPA уже была хотя бы одна навигация до текущей —
     *  то есть в history реально есть куда возвращаться. Первая загрузка (в т.ч. по прямой
     *  ссылке или после F5) считается count=1, назад из неё не идём. */
    canGoBack(): boolean {
        return this.navigationCount > 1;
    }

    back(): void {
        this.location.back();
    }
}
