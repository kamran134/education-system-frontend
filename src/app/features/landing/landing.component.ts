import { Component, DestroyRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { LandingService, PublicSummary } from './services/landing.service';

/** Показывается сразу, пока не пришёл живой ответ /api/public/summary (см. landing.service.ts). */
const SUMMARY_FALLBACK: PublicSummary = {
    regions: 12,
    districts: 78,
    schools: 1240,
    teachers: 8600,
    students: 196000,
};

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
    private landingService = inject(LandingService);
    private title = inject(Title);
    private meta = inject(Meta);
    private destroyRef = inject(DestroyRef);
    private platformId = inject(PLATFORM_ID);

    summary: PublicSummary = SUMMARY_FALLBACK;

    // Лендинг открыт для всех, включая авторизованных: это единственный способ для них
    // попасть сюда — по клику на лого (см. app.component.html). Никакого отскока на /panel —
    // внутренняя навигация (гварды, кнопки "назад", логин) и так ведёт на /panel напрямую,
    // а не через '/', так что до этой страницы залогиненный доходит только осознанно.
    ngOnInit(): void {
        this.title.setTitle('İSİM — İbtidai Siniflərin İnkişaf Metodikası');
        this.meta.updateTag({
            name: 'description',
            content: 'İSİM 1–4-cü siniflərin biliyini aylıq imtahanlarla ölçür və şagird, müəllim, məktəb, rayon üzrə reytinq hesablayır.',
        });

        // apiUrl относительный ('/api') в проде — во время SSR-пререндера запрос не резолвится,
        // поэтому живые цифры подтягиваем только в браузере; на сервере остаются fallback-константы.
        if (isPlatformBrowser(this.platformId)) {
            this.landingService.getSummary(this.destroyRef).subscribe((summary) => {
                this.summary = summary;
            });
        }
    }

    /**
     * Intl.NumberFormat('az-AZ') даёт разный разделитель тысяч на сервере и в браузере
     * (Node: точка "196.000", Chromium: запятая "196,000" — ICU-данные для az-AZ неполные
     * и расходятся между рантаймами), что било бы SSR-гидратацию. Группируем вручную
     * неразрывным пробелом — детерминировано и совпадает с примерами из LANDING_TASK.md §4.3.
     */
    formatNumber(value: number): string {
        return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}
