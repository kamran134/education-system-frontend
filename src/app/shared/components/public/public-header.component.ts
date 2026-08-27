import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Шапка публичных страниц (лендинг, /metodika). Вынесена из landing.component.html,
 * когда появилась вторая публичная страница — иначе правку пришлось бы дублировать.
 */
@Component({
    selector: 'app-public-header',
    standalone: true,
    imports: [RouterModule],
    template: `
        <header class="h-[74px] flex items-center justify-between px-6 md:px-10 bg-[#FBFBFA] border-b-2 border-brand-ink">
            <a routerLink="/" aria-label="İSİM — ana səhifə">
                <img src="assets/isim-tiles.png" alt="İSİM" width="480" height="120" class="h-[42px] w-auto" />
            </a>
            <a [routerLink]="isAuthorized ? '/panel' : '/login'"
               class="inline-flex items-center rounded-full bg-brand-redInk px-[22px] py-[10px] text-sm font-bold text-brand-off hover:opacity-90 transition-opacity">
                {{ isAuthorized ? 'Sistemə keç' : 'Sistemə giriş' }}
            </a>
        </header>
    `,
})
export class PublicHeaderComponent {
    private authService = inject(AuthService);

    // На сервере при пререндере всегда false (аноним) — кнопка ведёт на /login. В браузере
    // у уже авторизованного она переключается на /panel: незачем гнать его на форму входа.
    get isAuthorized(): boolean {
        return this.authService.isAuthorized;
    }
}
