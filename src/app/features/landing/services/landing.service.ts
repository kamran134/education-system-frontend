import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, map } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/response.model';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

export interface PublicSummary {
    regions: number;
    districts: number;
    schools: number;
    teachers: number;
    students: number;
}

@Injectable({
    providedIn: 'root',
})
export class LandingService {
    private http = inject(HttpClient);
    private configService = inject(ConfigService);

    /**
     * Аноним, без токена — как /booklets/public/:id. В проде apiUrl относительный ('/api'),
     * поэтому во время SSR-пререндера запрос не выполняется (см. LandingComponent — вызывается
     * только в браузере); константы-заглушки на этот случай задаёт вызывающий компонент.
     *
     * Ошибка сети/бэкенда гасится через EMPTY, а не of(null): subscribe() в этом случае просто
     * не получает next(), и вызывающая сторона остаётся на своих fallback-значениях — без этого
     * null перезаписал бы уже отрисованные константы.
     */
    getSummary(destroyRef: DestroyRef): Observable<PublicSummary> {
        const url = `${this.configService.getApiUrl()}/public/summary`;
        return this.http.get<ApiResponse<PublicSummary>>(url).pipe(
            map((response) => ResponseHandlerUtil.extractData<PublicSummary>(response)),
            catchError(() => EMPTY),
            takeUntilDestroyed(destroyRef)
        );
    }
}
