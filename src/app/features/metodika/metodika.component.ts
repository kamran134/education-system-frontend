import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { PublicHeaderComponent } from '../../shared/components/public/public-header.component';
import { PublicFooterComponent } from '../../shared/components/public/public-footer.component';

interface Discipline {
    name: string;
    questions: number;
    barClass: string;
}

interface Level {
    code: string;
    percent: string;
    tileClass: string;
}

interface YearPoint {
    title: string;
    /** Строка, а не число: за участие начисляется диапазон «1–6», а не одно значение. */
    points: string;
    note: string;
}

/**
 * Публичная страница «İSİM metodikası» — развёрнутый пересказ PDF заказчика
 * «İSİM layihəsi barədə məlumat» (папка samir, 27.08.2026) в вёрстке лендинга.
 */
@Component({
    selector: 'app-metodika',
    standalone: true,
    imports: [RouterModule, PublicHeaderComponent, PublicFooterComponent],
    templateUrl: './metodika.component.html',
    styleUrl: './metodika.component.scss',
})
export class MetodikaComponent implements OnInit {
    private title = inject(Title);
    private meta = inject(Meta);

    /** 50 вопросов Мərkəzləşmiş İmtahan — состав из PDF и подтверждён шапкой файла загрузки. */
    readonly disciplines: readonly Discipline[] = [
        { name: 'Azərbaycan dili', questions: 15, barClass: 'bg-brand-red' },
        { name: 'Riyaziyyat', questions: 15, barClass: 'bg-brand-blue' },
        { name: 'Həyat Bilgisi', questions: 10, barClass: 'bg-brand-green' },
        { name: 'Məntiq', questions: 10, barClass: 'bg-brand-magenta' },
    ];

    readonly totalQuestions = 50;

    /**
     * Пороги уровней — процентные, из файла «Nəticələr - Sual sayı və düzgün cavablarla.xlsx»
     * (27.08.2026). Заказчик решил показывать на этой странице новую процентную шкалу,
     * а расчёт в самой системе пока оставить на старых абсолютных порогах из таблицы levels
     * (E 0–15, D 16–25, C 26–34, B 35–41, A 42–46, Lisey 47+ при 50 вопросах).
     *
     * ВНИМАНИЕ, границы расходятся: 47 баллов из 50 — это 94%, то есть «A» по шкале ниже,
     * но «Lisey» по текущему min_total_score=47 в проде. Расхождение ровно на один балл
     * на стыке A/Lisey; когда систему переведут на проценты, оно исчезнет.
     */
    readonly levels: readonly Level[] = [
        { code: 'E', percent: '0–29%', tileClass: 'bg-[#FED716] text-brand-ink' },
        { code: 'D', percent: '30–49%', tileClass: 'bg-[#F37820] text-white' },
        { code: 'C', percent: '50–69%', tileClass: 'bg-brand-magenta text-white' },
        { code: 'B', percent: '70–83%', tileClass: 'bg-brand-green text-white' },
        { code: 'A', percent: '84–94%', tileClass: 'bg-brand-blue text-white' },
        { code: 'Lisey', percent: '95–100%', tileClass: 'bg-brand-red text-white' },
    ];

    /**
     * Баллы годового зачёта. Первые два подтверждены прод-базой (development_score = 10,
     * student_of_the_month_score = 5). Третий в PDF записан как «1 bal», но система
     * начисляет балл уровня — см. studentResult.service.pg.ts, participationScore =
     * currentLevelScore, то есть 1 за E … 6 за Lisey. Пишем как считает система.
     */
    readonly yearPoints: readonly YearPoint[] = [
        { title: 'İNKİŞAF EDƏN ŞAGİRD', points: '10', note: 'Bir pillə yüksəyə qalxdığı hər imtahana görə' },
        { title: 'AYIN ƏN YAXŞI ŞAGİRDİ', points: '5', note: 'Ayın nəticələrinə görə seçilirsə' },
        { title: 'İMTAHANDA İŞTİRAK', points: '1–6', note: 'Hər Mərkəzləşmiş İmtahana görə, düşdüyü səviyyəyə uyğun' },
    ];

    ngOnInit(): void {
        this.title.setTitle('İSİM metodikası — İbtidai Siniflərin İnkişaf Metodikası');
        this.meta.updateTag({
            name: 'description',
            content: 'İSİM metodikası iki əsas hissədən ibarətdir: şagirdin hədəfini formalaşdırmaq və onun qavrama üslubunu müəllimin öyrətmə üslubu ilə uzlaşdırmaq.',
        });
    }
}
