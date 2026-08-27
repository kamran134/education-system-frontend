import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PublicHeaderComponent } from '../../shared/components/public/public-header.component';
import { PublicFooterComponent } from '../../shared/components/public/public-footer.component';

interface HeroStat {
    value: number;
    label: string;
}

/**
 * Полоса цифр в герое (ТЗ «Baş səhifə məlumatları və dizaynı», п. 1).
 *
 * Константы, а не живой /api/public/summary — сознательное решение заказчика.
 * Что говорят реальные данные на 27.08.2026 (проверено по проду и по mongodump'ам с сервера):
 *
 *   попали в рейтинг (есть хотя бы один результат экзамена)
 *     2024/2025 — 243 школы, 405 учителей, 1 720 учеников
 *     2025/2026 — 412 школ,  783 учителя,  5 476 учеников
 *     уникальных за два года — 412 / 783 / 5 476 (состав только рос, никто не выбыл)
 *   реестр сегодня — 720 школ, 927 учителей, 5 482 ученика
 *   пик реестра (бэкап /root/isim/db_backup_new.gz, 26.02.2026) — 901 / 2 994 / 14 371,
 *     из них 9 872 ученика без единого результата; позже вычищены
 *
 * Цифры ниже — точный пик реестра, без округления (заказчик прямо просил точные числа,
 * 28.08.2026). Заказчику нужен масштаб охвата, а не число участников рейтинга. Вернуть
 * живые данные — снова заинжектить LandingService
 * (удалён вместе с этим коммитом, бэкендовый GET /api/public/summary на месте).
 */
const HERO_STATS: readonly HeroStat[] = [
    { value: 12, label: 'Regional Təhsil İdarəsi' },
    { value: 901, label: 'Məktəb' },
    { value: 2994, label: 'Layihə müəllimi' },
    { value: 14371, label: 'Layihə şagirdi' },
];

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, PublicHeaderComponent, PublicFooterComponent],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
    private authService = inject(AuthService);
    private title = inject(Title);
    private meta = inject(Meta);

    readonly stats = HERO_STATS;

    // На сервере при пререндере всегда false (аноним) — кнопки ведут на /login, тот же вид,
    // что и раньше. В браузере, если пользователь уже авторизован (зашёл сюда по клику на лого,
    // единственный путь для него — см. app.component.ts), они переключаются на /panel:
    // незачем гнать его обратно на форму входа, он уже внутри.
    get isAuthorized(): boolean {
        return this.authService.isAuthorized;
    }

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
    }

    /**
     * Intl.NumberFormat('az-AZ') даёт разный разделитель тысяч на сервере и в браузере
     * (Node: точка "196.000", Chromium: запятая "196,000" — ICU-данные для az-AZ неполные
     * и расходятся между рантаймами), что било бы SSR-гидратацию. Группируем вручную
     * неразрывным пробелом — детерминировано и совпадает с примерами из LANDING_TASK.md §4.3.
     */
    formatNumber(value: number): string {
        return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}
