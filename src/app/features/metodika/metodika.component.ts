import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { PublicHeaderComponent } from '../../shared/components/public/public-header.component';
import { PublicFooterComponent } from '../../shared/components/public/public-footer.component';
import { MetodikaService } from './services/metodika.service';
import {
    MetodikaContent,
    METODIKA_DEFAULT_CONTENT,
    mergeMetodikaContent,
    getDisciplineBarClass,
    getLevelTileClass,
    getLiveCardBadgeClass,
    getTotalQuestions,
} from './metodika-content.model';

/**
 * Публичная страница «İSİM metodikası» — развёрнутый пересказ PDF заказчика
 * «İSİM layihəsi barədə məlumat» (папка samir, 27.08.2026) в вёрстке лендинга.
 *
 * Контент редактируется в админке (п.6 ТЗ от 04.09.2026, dashboard/components/metodika-editor)
 * и хранится в app_settings. Дефолт (METODIKA_DEFAULT_CONTENT) отрисовывается сразу, не
 * дожидаясь ответа сервера, и заменяется сохранённым контентом по приходу — пустой страницы
 * или спиннера быть не должно. Ошибка запроса — молча остаёмся на дефолте.
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
    private metodikaService = inject(MetodikaService);

    content: MetodikaContent = METODIKA_DEFAULT_CONTENT;

    readonly getDisciplineBarClass = getDisciplineBarClass;
    readonly getLevelTileClass = getLevelTileClass;
    readonly getLiveCardBadgeClass = getLiveCardBadgeClass;

    get totalQuestions(): number {
        return getTotalQuestions(this.content.part1.disciplines);
    }

    ngOnInit(): void {
        this.title.setTitle('İSİM metodikası — İbtidai Siniflərin İnkişaf Metodikası');
        this.meta.updateTag({
            name: 'description',
            content: 'İSİM metodikası iki əsas hissədən ibarətdir: şagirdin hədəfini formalaşdırmaq və onun qavrama üslubunu müəllimin öyrətmə üslubu ilə uzlaşdırmaq.',
        });

        this.metodikaService.getContent()
            .pipe(catchError(() => of(null)))
            .subscribe(saved => {
                this.content = mergeMetodikaContent(saved);
            });
    }
}
