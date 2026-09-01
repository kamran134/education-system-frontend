import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { ApiResponse } from '../models/response.model';
import { ResponseHandlerUtil } from '../utils/response-handler.util';

export interface RatingYearState {
    ratingYear: number;
    currentAcademicYear: number;
    activated: boolean;
}

/**
 * REYTINQ_ILI_TASK.md §6 — год, за который карточки/подписи на главных страницах (регион/район/
 * школа/учитель) показывают баллы, когда год не выбран явно. Один GET на всё время жизни
 * приложения (shareReplay(1)): четыре профильные страницы не должны дёргать ручку каждая по
 * разу. Тумблер в админке (features/dashboard) читает состояние отдельно, напрямую через
 * AcademicYearService — там нужна свежая, а не закэшированная картина сразу после переключения.
 */
@Injectable({
    providedIn: 'root'
})
export class RatingYearService {
    private state$: Observable<RatingYearState> | null = null;
    private fetchedAt = 0;

    /** Кэш не навсегда: админ может переключить год тумблером, пока у кого-то открыто
     *  приложение — тогда карточки уже придут с новым годом (данные всегда свежие, с сервера),
     *  а подпись рядом с ними осталась бы от старого. Пять минут — потолок такого расхождения. */
    private static readonly TTL_MS = 5 * 60 * 1000;

    constructor(private http: HttpClient, private configService: ConfigService) { }

    getState(): Observable<RatingYearState> {
        if (this.state$ && Date.now() - this.fetchedAt > RatingYearService.TTL_MS) {
            this.state$ = null;
        }
        if (!this.state$) {
            this.fetchedAt = Date.now();
            const url = `${this.configService.getApiUrl()}/reference/rating-year`;
            this.state$ = this.http.get<ApiResponse<RatingYearState>>(url, { withCredentials: true })
                .pipe(
                    map(response => ResponseHandlerUtil.extractData<RatingYearState>(response)),
                    shareReplay(1)
                );
        }
        return this.state$;
    }
}
